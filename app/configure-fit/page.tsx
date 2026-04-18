'use client';
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Calendar, Loader2, Ruler, MapPin, Users, Heart, Lock, Unlock, Clock } from 'lucide-react';
import type { ServiceTypeId } from '@/types/booking';
import { sendOffsiteAlert } from '@/app/actions/sendOffsiteAlert';
import { useBookingServiceTypes } from '@/hooks/useBookingServiceTypes';
import { useBookingLocations } from '@/hooks/useBookingLocations';
import { useFitHandoff } from '@/lib/trouser/useFitHandoff';
import { useCategoryFitHandoff } from '@/lib/mtm/useCategoryFitHandoff';
import { buildCanonicalTrouserMtmPayload } from '@/lib/trouser/TrouserMtmPayload';
import { addTrouserToCart } from '@/lib/shopify/ShopifyTrouserAddToCartBridge';
import { resolvePostFitDestination } from '@/lib/fit/flow';
import { trackFitFlowEvent } from '@/lib/analytics/trackFitFlowEvent';
import { buildCategoryCartPayload } from '@/lib/mtm/CategoryCartPayloadBuilder';
import {
  updateFitProfile,
  updateBookingDetails,
  addSuitToCartBridge,
  type UpdateFitProfilePayload,
  type UpdateBookingDetailsPayload,
} from '@/lib/fit/fitSaveThroughAdapters';

type BlockMeasurements = Record<string, number>;
type BlockSizeMap = Record<string, BlockMeasurements>;

type SuitSelections = Record<string, string | string[] | undefined>;

type SuitHandoffPayload = {
  source: string;
  category: 'suit';
  optionSet: string;
  optionSetVersion: string;
  production: string;
  selections: SuitSelections;
  pricing?: {
    total: number;
    breakdown: Array<{
      key: string;
      label: string;
      amount: number;
    }>;
  };
  summary?: Record<string, string>;
  validation?: {
    isValid: boolean;
    missingRequired: string[];
    errors: string[];
  };
  savedAt?: string;
  continuedAt?: string;
};

type ActiveSuitHandoff = {
  key: string;
  payload: SuitHandoffPayload;
  timestamp: number;
};

interface FitComputationResult {
  jacketSize: number;
  trouserSize: number;
  jacketSpecs: Record<string, number>;
  trouserSpecs: Record<string, number>;
  isMismatch: boolean;
  jacketRequested: number;
  trouserRequested: number;
  jacketCarryLower: number;
  jacketCarryUpper: number;
  trouserCarryLower: number;
  trouserCarryUpper: number;
  label: string;
}

// THE SOURCE OF TRUTH: Data for exact block specifications
const measurementSpecs: Record<string, { jacket: BlockSizeMap; trouser: BlockSizeMap }> = {
  drop_8: {
    jacket: {
      '46': { back_length: 73.3, shoulders: 44.0, half_waist: 45.5 },
      '48': { back_length: 73.9, shoulders: 45.0, half_waist: 47.5 },
      '50': { back_length: 74.5, shoulders: 46.0, half_waist: 49.5 },
      '52': { back_length: 75.1, shoulders: 47.0, half_waist: 51.5 },
      '54': { back_length: 75.7, shoulders: 48.0, half_waist: 53.6 },
    },
    trouser: {
      '46': { half_waist: 41.0, rise: 17.8, hem: 18.4 },
      '48': { half_waist: 43.0, rise: 18.1, hem: 18.7 },
      '50': { half_waist: 45.0, rise: 18.5, hem: 19.0 },
      '52': { half_waist: 47.0, rise: 18.8, hem: 19.3 },
      '54': { half_waist: 49.0, rise: 19.5, hem: 19.6 },
    },
  },
  drop_7: {
    jacket: {
      '48': { back_length: 73.9, shoulders: 45.5, half_waist: 50.0 },
      '50': { back_length: 74.5, shoulders: 46.5, half_waist: 52.0 },
      '52': { back_length: 75.1, shoulders: 47.5, half_waist: 54.0 },
    },
    trouser: {
      '48': { half_waist: 43.0, rise: 19.1, hem: 20.7 },
      '50': { half_waist: 45.0, rise: 19.5, hem: 21.0 },
      '52': { half_waist: 47.0, rise: 19.8, hem: 21.3 },
    },
  },
  drop_6: {
    jacket: {
      '50': { back_length: 76.5, shoulders: 47.0, half_waist: 54.0 },
      '52': { back_length: 77.1, shoulders: 48.0, half_waist: 56.0 },
      '54': { back_length: 77.7, shoulders: 49.0, half_waist: 58.1 },
    },
    trouser: {
      '50': { half_waist: 45.0, rise: 22.5, hem: 22.0 },
      '52': { half_waist: 47.0, rise: 22.8, hem: 22.3 },
      '54': { half_waist: 49.0, rise: 23.5, hem: 22.6 },
    },
  },
};

const timelineProductionDays: Record<string, number> = {
  '5_days': 5,
  '7_days': 7,
  '8_days': 8,
  '14_days': 14,
  '3_weeks': 15,
  Flexible: 0,
};

const logisticsDaysInternationalExpress = 7;

const SUIT_BLACK_LABEL_HANDOFF_KEY = 'gjm_suit_black_label_handoff';
const SUIT_RED_LABEL_HANDOFF_KEY = 'gjm_suit_red_label_handoff';

function parseHandoffTimestamp(payload: SuitHandoffPayload): number {
  const candidate = payload.continuedAt || payload.savedAt;
  if (!candidate) return 0;

  const parsed = Date.parse(candidate);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function safeReadSuitHandoff(storageKey: string): ActiveSuitHandoff | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as SuitHandoffPayload;

    if (
      !parsed ||
      parsed.category !== 'suit' ||
      !parsed.optionSet ||
      !parsed.production ||
      !parsed.selections
    ) {
      return null;
    }

    return {
      key: storageKey,
      payload: parsed,
      timestamp: parseHandoffTimestamp(parsed),
    };
  } catch {
    return null;
  }
}

function resolveLatestSuitHandoff(): ActiveSuitHandoff | null {
  const candidates = [
    safeReadSuitHandoff(SUIT_BLACK_LABEL_HANDOFF_KEY),
    safeReadSuitHandoff(SUIT_RED_LABEL_HANDOFF_KEY),
  ].filter(Boolean) as ActiveSuitHandoff[];

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.timestamp - a.timestamp);
  return candidates[0];
}

function normalizeSuitSelections(input: SuitSelections): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string' && value.trim()) {
      normalized[key] = value;
    }
  }
  return normalized;
}

const toDateOnly = (value: string) => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const easterSunday = (year: number) => {
  // Gregorian computus for Easter Sunday.
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
};

const italianHolidayKeys = (year: number) => {
  const easter = easterSunday(year);
  const easterMonday = new Date(easter);
  easterMonday.setDate(easterMonday.getDate() + 1);

  const fixed = [
    `${year}-01-01`,
    `${year}-01-06`,
    `${year}-04-25`,
    `${year}-05-01`,
    `${year}-06-02`,
    `${year}-08-15`,
    `${year}-11-01`,
    `${year}-12-08`,
    `${year}-12-25`,
    `${year}-12-26`,
  ];

  const easterMondayKey = `${year}-${String(easterMonday.getMonth() + 1).padStart(2, '0')}-${String(easterMonday.getDate()).padStart(2, '0')}`;
  return new Set([...fixed, easterMondayKey]);
};

const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const isItalianProductionDay = (date: Date) => {
  const day = date.getDay();
  const isWeekend = day === 0 || day === 6;
  if (isWeekend) return false;

  // Italian Summer Holiday shutdown: first 3 weeks of August.
  const isAugustShutdown = date.getMonth() === 7 && date.getDate() <= 21;
  if (isAugustShutdown) return false;

  const holidays = italianHolidayKeys(date.getFullYear());
  return !holidays.has(dateKey(date));
};

const countProductionDaysBetween = (startExclusive: Date, endExclusive: Date) => {
  const cursor = new Date(startExclusive);
  cursor.setDate(cursor.getDate() + 1);

  let count = 0;
  while (cursor < endExclusive) {
    if (isItalianProductionDay(cursor)) {
      count += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
};

const formatYmd = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const STUDIO_LOCATION_FALLBACK =
  process.env.NEXT_PUBLIC_MAISON_STUDIO_ADDRESS || 'Maison Showroom (address shared on confirmation)';


function mapAppointmentModeToServiceType(mode: string): ServiceTypeId {
  if (mode === 'Home' || mode === 'Office' || mode === 'Location') return 'home_office';
  return 'showroom';
}

function mapServiceTypeToAppointmentMode(serviceType: ServiceTypeId): string {
  return serviceType === 'home_office' ? 'Home' : 'Studio';
}

function parseServiceType(value: string | null): ServiceTypeId | null {
  if (
    value === 'showroom' ||
    value === 'home_office' ||
    value === 'tailor_fitting' ||
    value === 'virtual' ||
    value === 'video_consult'
  ) {
    return value;
  }
  return null;
}

function toYyyyMmDdLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMinBookingDateByLeadTime(leadTimeHours: number): string {
  const date = new Date(Date.now() + leadTimeHours * 60 * 60 * 1000);
  return toYyyyMmDdLocal(date);
}

function FitConfiguratorContent() {
  const searchParams = useSearchParams();
  const { serviceTypeMap } = useBookingServiceTypes();
  const { enabledLocations, locationMap, defaultLocationId } = useBookingLocations();
  const {
    snapshot: trouserDesignSnapshot,
    source: trouserDesignSource,
    requiresTrouserRedirect,
  } = useFitHandoff(searchParams);
  const {
    snapshot: categoryDesignSnapshot,
    source: categoryDesignSource,
  } = useCategoryFitHandoff(searchParams);
  const [activeSuitHandoff, setActiveSuitHandoff] = useState<ActiveSuitHandoff | null>(null);

  useEffect(() => {
    setActiveSuitHandoff(resolveLatestSuitHandoff());
  }, []);

  const resolvedCategoryDesignSnapshot = useMemo(() => {
    if (categoryDesignSnapshot && categoryDesignSnapshot.category !== 'suit') {
      return categoryDesignSnapshot;
    }

    if (!activeSuitHandoff) {
      return categoryDesignSnapshot;
    }

    const normalizedSelections = normalizeSuitSelections(activeSuitHandoff.payload.selections);
    if (!Object.keys(normalizedSelections).length) {
      return categoryDesignSnapshot;
    }

    return {
      category: 'suit' as const,
      optionSet: activeSuitHandoff.payload.optionSet,
      optionSetVersion: activeSuitHandoff.payload.optionSetVersion,
      selections: normalizedSelections,
      pricing: activeSuitHandoff.payload.pricing || {
        total: 0,
        breakdown: [],
      },
      createdAt:
        activeSuitHandoff.payload.continuedAt ||
        activeSuitHandoff.payload.savedAt ||
        new Date().toISOString(),
    };
  }, [activeSuitHandoff, categoryDesignSnapshot]);

  const resolvedCategoryDesignSourceLabel =
    resolvedCategoryDesignSnapshot?.category === 'suit' && activeSuitHandoff
      ? activeSuitHandoff.payload.source
      : categoryDesignSource;

  const activeSuitSummary = useMemo(
    () => (activeSuitHandoff?.payload.summary ? activeSuitHandoff.payload.summary : {}),
    [activeSuitHandoff],
  );

  const activeMtmCategory = resolvedCategoryDesignSnapshot?.category || (trouserDesignSnapshot ? 'trouser' : null);
  const [step, setStep] = useState(1);
  const [userEmail, setUserEmail] = useState('');
  const [isAutoFilled, setIsAutoFilled] = useState(false);

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [onLocationAddress, setOnLocationAddress] = useState('');
  const [bookingServiceType, setBookingServiceType] = useState<ServiceTypeId>('showroom');
  const [studioLocationId, setStudioLocationId] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [weddingDate, setWeddingDate] = useState('');
  const [bridalPartyCount, setBridalPartyCount] = useState('1');

  const [modalData, setModalData] = useState({
    useCase: '',
    appointmentMode: '',
    timeline: '',
    bodyBuild: '',
    profileName: '',
  });

  const [attributes, setAttributes] = useState({
    chest: '',
    stomach: '',
    waist: '',
    hips: '',
    height: '',
    weight: '',
    shoulderSlope: '',
    standingPosture: '',
    chestProfile: '',
    stomachProfile: '',
    seatShape: '',
    commonIssues: '',
    notes: '',
  });

  const [preferences, setPreferences] = useState({
    fitType: 'drop_8',
    trouserRise: 'Mid-Rise',
    trouserBreak: 'No Break',
    jacketLength: 'Standard',
  });

  const [result, setResult] = useState<FitComputationResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const minBookingDate = useMemo(
    () => getMinBookingDateByLeadTime(serviceTypeMap[bookingServiceType]?.leadTimeHours ?? 48),
    [bookingServiceType, serviceTypeMap],
  );

  const selectedStudioLocation = useMemo(
    () => locationMap[studioLocationId] || enabledLocations[0],
    [enabledLocations, locationMap, studioLocationId],
  );

  const weddingProductionValidation = useMemo(() => {
    if (modalData.useCase !== 'Wedding') {
      return { enforce: false, valid: true, message: '', nearestFeasibleDate: '' };
    }

    const requiredDays = timelineProductionDays[modalData.timeline] ?? 0;
    if (!requiredDays) {
      return {
        enforce: false,
        valid: true,
        message: 'Flexible timeline selected. Production schedule will be confirmed by the atelier.',
        nearestFeasibleDate: '',
      };
    }

    const appointment = toDateOnly(selectedDate);
    const wedding = toDateOnly(weddingDate);

    if (!appointment || !wedding) {
      return {
        enforce: true,
        valid: false,
        message: 'Select both appointment date and wedding date to validate production feasibility.',
        nearestFeasibleDate: '',
      };
    }

    const productionDeadline = new Date(wedding);
    productionDeadline.setDate(productionDeadline.getDate() - logisticsDaysInternationalExpress);

    const availableDaysForProduction = countProductionDaysBetween(appointment, productionDeadline);
    const valid = availableDaysForProduction >= requiredDays;

    if (valid) {
      return {
        enforce: true,
        valid: true,
        message: `Timeline feasible: ${availableDaysForProduction} Italian production days available for production (requires ${requiredDays}) plus ${logisticsDaysInternationalExpress} logistics days (DHL/FedEx/UPS International Express Priority).`,
        nearestFeasibleDate: '',
      };
    }

    // Compute the latest appointment that still allows required production days before logistics starts.
    const latestAllowedAppointment = new Date(productionDeadline);
    let subtracted = 0;
    while (subtracted < requiredDays) {
      latestAllowedAppointment.setDate(latestAllowedAppointment.getDate() - 1);
      if (isItalianProductionDay(latestAllowedAppointment)) {
        subtracted += 1;
      }
    }

    const nearestFeasibleDate = formatYmd(latestAllowedAppointment);

    return {
      enforce: true,
      valid: false,
      message: `Selected timeline is not feasible: ${availableDaysForProduction} Italian production days available, but ${requiredDays} are required, plus ${logisticsDaysInternationalExpress} logistics days are mandatory for international express shipping (DHL/FedEx/UPS). Earliest feasible appointment date is ${nearestFeasibleDate} (or earlier). Production runs Monday-Friday only, excluding Italian public holidays and 1-21 August shutdown.`,
      nearestFeasibleDate,
    };
  }, [modalData.timeline, modalData.useCase, selectedDate, weddingDate]);

  useEffect(() => {
    const email = searchParams.get('email');
    const useCase = searchParams.get('primaryUseCase');
    const mode = searchParams.get('appointmentMode');
    const serviceTypeFromQuery = parseServiceType(searchParams.get('serviceType'));
    const resolvedServiceType = serviceTypeFromQuery || mapAppointmentModeToServiceType(mode || 'Studio');
    const modeFromServiceType = mapServiceTypeToAppointmentMode(resolvedServiceType);
    const locationFromQuery = searchParams.get('location') || '';
    const locationIdFromQuery = searchParams.get('locationId') || '';

    trackFitFlowEvent({
      eventName: 'gjm_fit_flow_start',
      flowName: 'configure',
      email: email || undefined,
      productHandle: searchParams.get('productHandle') || undefined,
      variantId: searchParams.get('variantId') || undefined,
      source: 'fit_configure_ui',
    });

    if (email) {
      setUserEmail(email);
      setIsAutoFilled(true);
    }

    setModalData({
      useCase: useCase || '',
      appointmentMode: mode || modeFromServiceType,
      timeline: searchParams.get('productionTimeline') || '',
      bodyBuild: searchParams.get('bodyBuild') || '',
      profileName: searchParams.get('profileName') || 'New Bespoke Profile',
    });

    setBookingServiceType(resolvedServiceType);
    setStudioLocationId(locationIdFromQuery);
    setSelectedDate(searchParams.get('date') || '');
    setSelectedTime(searchParams.get('timeSlot') || '');
    setOnLocationAddress(locationFromQuery);

    setAttributes((prev) => ({
      ...prev,
      commonIssues: searchParams.get('issues') || '',
      notes: searchParams.get('notes') || '',
      // Keep chest/waist/stomach/hips manual in this step, but carry FitGate anatomy metadata.
      height: searchParams.get('height') || prev.height,
      weight: searchParams.get('weight') || prev.weight,
      shoulderSlope: searchParams.get('shoulderSlope') || prev.shoulderSlope,
      standingPosture: searchParams.get('standingPosture') || prev.standingPosture,
      chestProfile: searchParams.get('chestProfile') || prev.chestProfile,
      stomachProfile: searchParams.get('stomachProfile') || prev.stomachProfile,
      seatShape: searchParams.get('seatShape') || prev.seatShape,
    }));
  }, [searchParams]);

  useEffect(() => {
    if (studioLocationId && locationMap[studioLocationId]?.enabled) {
      return;
    }

    if (defaultLocationId) {
      setStudioLocationId(defaultLocationId);
    }
  }, [defaultLocationId, locationMap, studioLocationId]);

  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots([]);
      return;
    }

    let cancelled = false;

    async function loadAvailability() {
      try {
        setIsCheckingAvailability(true);

        const response = await fetch('/api/bookings/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: selectedDate, serviceType: bookingServiceType }),
        });

        const data = await response.json();
        if (cancelled) return;

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load availability');
        }

        const slots: string[] = Array.isArray(data.availableSlots) ? data.availableSlots : [];
        setAvailableSlots(slots);
        setSelectedTime((previous) => (slots.includes(previous) ? previous : ''));
      } catch {
        if (cancelled) return;
        setAvailableSlots([]);
      } finally {
        if (!cancelled) setIsCheckingAvailability(false);
      }
    }

    loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [bookingServiceType, selectedDate]);

  const handlePhysicalSubmit = () => {
    if (!attributes.chest || !attributes.stomach || !attributes.waist || !attributes.hips || !userEmail) {
      alert('Please complete all physical measurements and email to proceed.');
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(2);
  };

  const runDigitalTailor = () => {
    const jSizeRaw = Math.round(Number(attributes.chest) / 2);
    const tSizeRaw = Math.round(Number(attributes.waist) / 2 + 5); // aligned with master tailor logic

    const normalizeToEvenUp = (size: number) => (size % 2 === 0 ? size : size + 1);

    const chooseAvailableSize = (requestedSize: number, table: Record<string, unknown> | undefined) => {
      const availableSizes = Object.keys(table || {})
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value))
        .sort((a, b) => a - b);

      if (!availableSizes.length) return null;
      if (availableSizes.includes(requestedSize)) return requestedSize;

      const nextUp = availableSizes.find((size) => size >= requestedSize);
      if (nextUp) return nextUp;

      return availableSizes[availableSizes.length - 1] || null;
    };

    const jacketRequested = normalizeToEvenUp(jSizeRaw);
    const trouserRequested = normalizeToEvenUp(tSizeRaw);

    const jacketTable = measurementSpecs[preferences.fitType]?.jacket;
    const trouserTable = measurementSpecs[preferences.fitType]?.trouser;

    const jacketResolvedSize = chooseAvailableSize(jacketRequested, jacketTable);
    const trouserResolvedSize = chooseAvailableSize(trouserRequested, trouserTable);

    const jacketSpecs = jacketResolvedSize ? jacketTable?.[jacketResolvedSize.toString()] || null : null;
    const trouserSpecs = trouserResolvedSize ? trouserTable?.[trouserResolvedSize.toString()] || null : null;

    if (!jacketSpecs || !trouserSpecs || !jacketResolvedSize || !trouserResolvedSize) {
      alert(`No block specs found for this profile (${preferences.fitType}). Please adjust measurements or fit type.`);
      return;
    }

    // Give the tailor practical carry sizes around the raw computed recommendation.
    const jacketCarryLower = normalizeToEvenUp(jSizeRaw) - 2;
    const jacketCarryUpper = normalizeToEvenUp(jSizeRaw);
    const trouserCarryLower = normalizeToEvenUp(tSizeRaw) - 2;
    const trouserCarryUpper = normalizeToEvenUp(tSizeRaw);

    setResult({
      jacketSize: jacketResolvedSize,
      trouserSize: trouserResolvedSize,
      jacketSpecs,
      trouserSpecs,
      isMismatch: jacketResolvedSize !== trouserResolvedSize,
      jacketRequested,
      trouserRequested,
      jacketCarryLower,
      jacketCarryUpper,
      trouserCarryLower,
      trouserCarryUpper,
      label: preferences.fitType === 'drop_8' ? 'Slim Fit' : preferences.fitType === 'drop_7' ? 'Regular Fit' : 'Classic Fit',
    });

    setStep(3);
  };

  const confirmForFitting = async (finalTime?: string) => {
    if (!userEmail || !userEmail.includes('@')) {
      alert('Please provide a valid email address to proceed.');
      return;
    }

    const offsiteModes = ['Home', 'Office', 'Location'];
    const isOffsite = offsiteModes.includes(modalData.appointmentMode);
    const resolvedServiceType = bookingServiceType;

    if (!selectedDate) {
      alert('Please select a date for your fitting.');
      return;
    }

    if (!selectedTime && !finalTime) {
      alert('Please select a time slot for your fitting.');
      return;
    }

    if (isOffsite && !onLocationAddress) {
      alert('Please provide the fitting address for On-Location service.');
      return;
    }

    if (modalData.useCase === 'Wedding' && !weddingDate) {
      alert('Please select your wedding date to validate production scheduling.');
      return;
    }

    if (modalData.useCase === 'Wedding' && weddingProductionValidation.enforce && !weddingProductionValidation.valid) {
      alert(weddingProductionValidation.message);
      return;
    }

    setIsSaving(true);

    try {
      if (!result) {
        throw new Error('Fit profile data is missing. Please complete the digital tailor step.');
      }

      if (!result.jacketSize || !result.trouserSize || !result.jacketSpecs || !result.trouserSpecs) {
        throw new Error('Profile sizing/specification data is incomplete.');
      }

      const appointmentTimeValue = finalTime || selectedTime;
      const activeCategorySnapshot =
        activeMtmCategory && activeMtmCategory !== 'trouser'
          ? resolvedCategoryDesignSnapshot
          : null;

      const canonicalBeforeProfile =
        activeMtmCategory === 'trouser'
          ? buildCanonicalTrouserMtmPayload({
              email: userEmail,
              fitPreference: result.label,
              jacketSize: result.jacketSize,
              trouserSize: result.trouserSize,
              appointmentDate: selectedDate,
              appointmentTime: appointmentTimeValue,
              attributes: {
                ...attributes,
                onLocationAddress,
                weddingDate,
                bridalPartyCount,
                ...modalData,
              },
              preferences,
              jacketSpecs: result.jacketSpecs,
              trouserSpecs: result.trouserSpecs,
              trouserDesign: trouserDesignSnapshot,
            })
          : null;

      const genericBeforeProfile =
        activeCategorySnapshot
          ? (() => {
              const categoryPayloadInput = {
                category: activeCategorySnapshot.category,
                optionSet: activeCategorySnapshot.optionSet,
                optionSetVersion: activeCategorySnapshot.optionSetVersion,
                selections: activeCategorySnapshot.selections,
                designUpcharge: activeCategorySnapshot.pricing.total,
                summary:
                  activeCategorySnapshot.category === 'suit'
                    ? activeSuitSummary
                    : undefined,
                handoffSource:
                  activeCategorySnapshot.category === 'suit'
                    ? activeSuitHandoff?.payload.source
                    : undefined,
                handoffStorageKey:
                  activeCategorySnapshot.category === 'suit'
                    ? activeSuitHandoff?.key
                    : undefined,
                fabricId: activeCategorySnapshot.fabricId,
                email: userEmail,
                fitPreference: result.label,
                appointmentDate: selectedDate,
                appointmentTime: appointmentTimeValue,
                attributes: {
                  ...attributes,
                  onLocationAddress,
                  weddingDate,
                  bridalPartyCount,
                  ...modalData,
                },
              };

              if (activeCategorySnapshot.category === 'suit') {
                (categoryPayloadInput as Record<string, unknown>).production =
                  activeSuitHandoff?.payload.production;
              }

              return buildCategoryCartPayload(
                categoryPayloadInput as Parameters<typeof buildCategoryCartPayload>[0],
              );
            })()
          : null;

      const profilePayload: UpdateFitProfilePayload = {
        email: userEmail,
        label: modalData.profileName || 'New Profile',
        categoryDefaults: {
          jacket: { size: result.jacketSize.toString() },
          trouser: { size: result.trouserSize.toString() },
        },
        fitPreference: result.label,
        appointmentDate: selectedDate,
        appointmentTime: appointmentTimeValue,
        technicalSpecs: {
          attributes: {
            ...attributes,
            onLocationAddress,
            weddingDate,
            bridalPartyCount,
            ...modalData,
          },
          trouserDesign: trouserDesignSnapshot,
          categoryDesign: activeCategorySnapshot,
          mtmCanonical: canonicalBeforeProfile || genericBeforeProfile?.canonicalPayload,
          cartAttributesSnapshot: canonicalBeforeProfile?.lineItemProperties || genericBeforeProfile?.lineItemAttributes,
          preferences,
          jacket: result.jacketSpecs,
          trouser: result.trouserSpecs,
        },
      };

      const { profileId } = await updateFitProfile(profilePayload);
      const clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const clientLocale = Intl.DateTimeFormat().resolvedOptions().locale || 'en-US';

      const canonicalAfterProfile =
        activeMtmCategory === 'trouser'
          ? buildCanonicalTrouserMtmPayload({
              email: userEmail,
              fitPreference: result.label,
              jacketSize: result.jacketSize,
              trouserSize: result.trouserSize,
              appointmentDate: selectedDate,
              appointmentTime: appointmentTimeValue,
              fitProfileId: profileId,
              attributes: {
                ...attributes,
                onLocationAddress,
                weddingDate,
                bridalPartyCount,
                clientTimeZone,
                clientLocale,
                ...modalData,
              },
              preferences,
              jacketSpecs: result.jacketSpecs,
              trouserSpecs: result.trouserSpecs,
              trouserDesign: trouserDesignSnapshot,
            })
          : null;

      const genericAfterProfile =
        activeCategorySnapshot
            ? buildCategoryCartPayload({
              category: activeCategorySnapshot.category,
              optionSet: activeCategorySnapshot.optionSet,
              optionSetVersion: activeCategorySnapshot.optionSetVersion,
              selections: activeCategorySnapshot.selections,
              designUpcharge: activeCategorySnapshot.pricing.total,
              production:
                activeCategorySnapshot.category === 'suit'
                  ? activeSuitHandoff?.payload.production
                  : undefined,
              summary:
                activeCategorySnapshot.category === 'suit'
                  ? activeSuitSummary
                  : undefined,
              handoffSource:
                activeCategorySnapshot.category === 'suit'
                  ? activeSuitHandoff?.payload.source
                  : undefined,
              handoffStorageKey:
                activeCategorySnapshot.category === 'suit'
                  ? activeSuitHandoff?.key
                  : undefined,
              fitProfileId: profileId,
              fabricId: activeCategorySnapshot.fabricId,
              fitGateVersion: activeCategorySnapshot.optionSetVersion,
              email: userEmail,
              fitPreference: result.label,
              appointmentDate: selectedDate,
              appointmentTime: appointmentTimeValue,
              attributes: {
                ...attributes,
                onLocationAddress,
                weddingDate,
                bridalPartyCount,
                clientTimeZone,
                clientLocale,
                ...modalData,
              },
            })
          : null;

      document.cookie = `fit_profile_id=${profileId}; path=/; max-age=31536000`;

      const payload: UpdateBookingDetailsPayload = {
        email: userEmail,
        fitPreference: result.label,
        jacketSize: result.jacketSize,
        trouserSize: result.trouserSize,
        appointmentDate: selectedDate,
        appointmentTime: appointmentTimeValue,
        technicalSpecs: {
          attributes: {
            ...attributes,
            onLocationAddress,
            weddingDate,
            bridalPartyCount,
            clientTimeZone,
            clientLocale,
            ...modalData,
          },
          trouserDesign: trouserDesignSnapshot,
          categoryDesign: activeCategorySnapshot,
          mtmCanonical: canonicalAfterProfile || genericAfterProfile?.canonicalPayload,
          cartAttributesSnapshot: canonicalAfterProfile?.lineItemProperties || genericAfterProfile?.lineItemAttributes,
          preferences,
          jacket: result.jacketSpecs,
          trouser: result.trouserSpecs,
        },
        cartAttributes: canonicalAfterProfile?.lineItemProperties || genericAfterProfile?.lineItemAttributes,
        fitProfileId: profileId,
        bookingId: profileId,
      };

      const { promotedBookingId } = await updateBookingDetails(payload);

      const shouldAutoCreateBooking =
        searchParams.get('source') === 'fit-booking-refresh' ||
        Boolean(searchParams.get('serviceType') && searchParams.get('date') && searchParams.get('timeSlot'));

      if (shouldAutoCreateBooking && !promotedBookingId) {
        const resolvedLocation = isOffsite
          ? onLocationAddress.trim()
          : (searchParams.get('location') || selectedStudioLocation?.address || STUDIO_LOCATION_FALLBACK);

        const bookingResponse = await fetch('/api/bookings/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceType: resolvedServiceType,
            location: resolvedLocation,
            date: selectedDate,
            timeSlot: appointmentTimeValue,
            customerEmail: userEmail,
            notes: `Created after Smart Fit completion (${modalData.appointmentMode || resolvedServiceType})`,
          }),
        });

        const bookingData = await bookingResponse.json();
        if (!bookingResponse.ok || !bookingData.success) {
          throw new Error(bookingData.message || 'Unable to create booking after fit profile save');
        }

        const destination = new URL(
          typeof bookingData.manageUrl === 'string' ? bookingData.manageUrl : '/booking-confirmed',
          window.location.origin,
        );
        destination.searchParams.set('time', appointmentTimeValue);
        destination.searchParams.set('date', selectedDate);
        destination.searchParams.set('email', userEmail);
        destination.searchParams.set('useCase', modalData.useCase || 'Business');
        destination.searchParams.set('serviceType', resolvedServiceType);
        if (typeof bookingData.bookingId === 'string' && bookingData.bookingId) {
          destination.searchParams.set('bookingId', bookingData.bookingId);
        }
        if (typeof bookingData.manageToken === 'string' && bookingData.manageToken) {
          destination.searchParams.set('manageToken', bookingData.manageToken);
        }
        window.location.href = `${destination.pathname}?${destination.searchParams.toString()}`;
        return;
      }

      if (isOffsite) {
        const offsiteResult = await sendOffsiteAlert({
          email: userEmail,
          appointmentMode: modalData.appointmentMode,
          address: onLocationAddress,
          profileName: modalData.profileName,
          date: selectedDate,
          time: appointmentTimeValue,
        });

        if (!offsiteResult?.ok) {
          console.error('[confirmForFitting] Offsite alert failed:', offsiteResult?.error);
        }
      }

      // Attempt to add configured MTM item to Shopify cart with full metadata
      const variantId = searchParams.get('variantId');
      if (variantId && (canonicalAfterProfile || genericAfterProfile)) {
        try {
          const cartResult =
            activeMtmCategory === 'trouser' && canonicalAfterProfile
              ? await addTrouserToCart({
                  variantId,
                  quantity: 1,
                  canonicalPayload: canonicalAfterProfile,
                })
              : await addSuitToCartBridge({
                  variantId,
                  cartAttributes: genericAfterProfile?.lineItemAttributes || {},
                });

          if (cartResult.ok) {
            // Success: redirect to cart or checkout
            const checkoutUrl = searchParams.get('checkoutRedirectTo') || '/cart';
            trackFitFlowEvent({
              eventName: 'gjm_fit_flow_save_success',
              flowName: 'configure',
              email: userEmail,
              fitProfileId: profileId,
              productHandle: searchParams.get('productHandle') || undefined,
              variantId,
              destination: checkoutUrl,
              source: 'fit_configure_ui',
            });
            window.location.href = checkoutUrl;
            return;
          } else {
            // Cart add failed: log but continue to confirmation page
            console.warn('[confirmForFitting] Failed to add to cart:', cartResult.error);
          }
        } catch (cartError) {
          // Cart error: log and continue
          console.error('[confirmForFitting] Cart exception:', cartError);
        }
      }

      // Fallback: resolve next step consistently across fit flows.
      const destination = resolvePostFitDestination(searchParams, {
        email: userEmail,
        defaultPath: '/fit/book',
      });
      trackFitFlowEvent({
        eventName: 'gjm_fit_flow_save_success',
        flowName: 'configure',
        email: userEmail,
        fitProfileId: profileId,
        productHandle: searchParams.get('productHandle') || undefined,
        variantId: searchParams.get('variantId') || undefined,
        destination,
        source: 'fit_configure_ui',
      });
      window.location.href = destination;
    } catch (error) {
      console.error('[confirmForFitting] Submission failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      trackFitFlowEvent({
        eventName: 'gjm_fit_flow_save_failure',
        flowName: 'configure',
        email: userEmail,
        productHandle: searchParams.get('productHandle') || undefined,
        variantId: searchParams.get('variantId') || undefined,
        errorMessage,
        source: 'fit_configure_ui',
      });
      alert(`Error submitting profile: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#FDFDFD] p-4 text-black font-sans">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="bg-black p-8 text-center">
          <h1 className="text-white font-serif text-3xl tracking-[0.2em] uppercase">Germaine Joseph</h1>
          <p className="text-zinc-400 text-[10px] mt-2 uppercase tracking-widest">Master Tailor Intake</p>
        </div>

        <div className="p-8 md:p-12">
          {(trouserDesignSnapshot || resolvedCategoryDesignSnapshot) && (
            <div className="mb-6 rounded-xl border border-[#826300]/20 bg-[#F8F5ED] p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#826300]">
                    Your {activeMtmCategory ? `${activeMtmCategory} ` : ''}Design
                  </p>
                  <p className="text-sm text-zinc-600">
                    Source:{' '}
                    <span className="font-semibold text-zinc-800">
                      {trouserDesignSnapshot ? trouserDesignSource : resolvedCategoryDesignSourceLabel}
                    </span>{' '}
                    · Option Set{' '}
                    <span className="font-semibold text-zinc-800">
                      {trouserDesignSnapshot
                        ? trouserDesignSnapshot.optionSetVersion
                        : resolvedCategoryDesignSnapshot?.optionSetVersion}
                    </span>
                  </p>
                </div>
                <p className="text-xs font-semibold text-zinc-700">
                  Design Upcharge: €
                  {(trouserDesignSnapshot?.pricing.total ?? resolvedCategoryDesignSnapshot?.pricing.total ?? 0).toFixed(2)}
                </p>
              </div>

              {!trouserDesignSnapshot && activeSuitHandoff?.payload.production ? (
                <p className="mt-2 text-xs text-zinc-700">
                  Production: <span className="font-semibold text-zinc-900">{activeSuitHandoff.payload.production}</span>
                </p>
              ) : null}

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {Object.entries(trouserDesignSnapshot?.selections || resolvedCategoryDesignSnapshot?.selections || {})
                  .slice(0, 6)
                  .map(([key, value]) => (
                    <div key={key} className="rounded-lg bg-white px-3 py-2 text-xs text-zinc-700">
                      <span className="font-semibold text-zinc-900">{key.replace(/_/g, ' ')}</span>: {value}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {requiresTrouserRedirect && (
            <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">We could not recover your trouser design handoff.</p>
              <p className="mt-1">Please return to the configurator to restore your design before completing fit intake.</p>
              <button
                onClick={() => {
                  window.location.href = '/p/mtm-trouser-test-build';
                }}
                className="mt-3 rounded-md bg-amber-700 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-amber-800"
              >
                Return To Trouser Configurator
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="text-center mb-8">
                <h3 className="text-xl font-serif tracking-widest uppercase">Physical Profile</h3>
              </div>

              <div className="space-y-1 relative">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Account Email</label>
                  {isAutoFilled && (
                    <button onClick={() => setIsAutoFilled(false)} className="text-[9px] text-zinc-300 hover:text-black flex items-center gap-1">
                      <Unlock size={10} /> Edit
                    </button>
                  )}
                </div>

                <input
                  type="email"
                  readOnly={isAutoFilled}
                  className={`w-full p-4 border-b outline-none transition-all ${isAutoFilled ? 'bg-gray-50/80 text-zinc-400 italic' : 'bg-gray-50/50'}`}
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                />

                {isAutoFilled && <Lock size={12} className="absolute right-4 bottom-5 text-zinc-200" />}
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Ruler size={12} /> Chest (cm)
                  </label>
                  <input
                    type="number"
                    className="w-full p-4 border-b bg-gray-50/50 outline-none"
                    value={attributes.chest}
                    onChange={(e) => setAttributes({ ...attributes, chest: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Stomach (cm)</label>
                  <input
                    type="number"
                    className="w-full p-4 border-b bg-gray-50/50 outline-none"
                    value={attributes.stomach}
                    onChange={(e) => setAttributes({ ...attributes, stomach: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Ruler size={12} /> Waist (cm)
                  </label>
                  <input
                    type="number"
                    className="w-full p-4 border-b bg-gray-50/50 outline-none"
                    value={attributes.waist}
                    onChange={(e) => setAttributes({ ...attributes, waist: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Hips (cm)</label>
                  <input
                    type="number"
                    className="w-full p-4 border-b bg-gray-50/50 outline-none"
                    value={attributes.hips}
                    onChange={(e) => setAttributes({ ...attributes, hips: e.target.value })}
                  />
                </div>
              </div>

              <button
                onClick={handlePhysicalSubmit}
                className="w-full bg-black text-white py-5 mt-4 rounded-sm font-bold uppercase tracking-widest hover:bg-zinc-900 transition-all"
              >
                Configure Style Preferences
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="text-center">
                <h3 className="text-xl font-serif">Stylistic Configuration</h3>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Silhouette Intent</label>
                <div className="grid grid-cols-3 gap-3">
                  {['drop_8', 'drop_7', 'drop_6'].map((d) => (
                    <button
                      key={d}
                      onClick={() => setPreferences({ ...preferences, fitType: d })}
                      className={`py-4 text-[10px] tracking-widest border ${preferences.fitType === d ? 'bg-black text-white' : 'border-gray-200 text-gray-400'}`}
                    >
                      {d === 'drop_8' ? 'SLIM' : d === 'drop_7' ? 'REGULAR' : 'CLASSIC'}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={runDigitalTailor} className="w-full bg-black text-white py-5 rounded-sm font-bold uppercase tracking-widest shadow-xl">
                Generate Digital Profile
              </button>
            </div>
          )}

          {step === 3 && result && (
            <div className="text-center space-y-8 animate-in slide-in-from-bottom-8">
              <div className="bg-zinc-50 p-10 rounded-2xl border border-zinc-100">
                <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-400 mb-6 font-bold">MTM Specification</p>
                <div className="flex justify-center items-baseline gap-12 my-8">
                  <div>
                    <p className="text-5xl font-serif">{result.jacketSize}</p>
                    <p className="text-[10px] uppercase font-bold text-zinc-500">Jacket</p>
                  </div>
                  <div className="h-12 w-[1px] bg-zinc-200" />
                  <div>
                    <p className="text-5xl font-serif">{result.trouserSize}</p>
                    <p className="text-[10px] uppercase font-bold text-zinc-500">Trouser</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(4)}
                disabled={isSaving}
                className="w-full bg-black text-white py-6 rounded-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3"
              >
                Confirm & Schedule Fitting
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 animate-in fade-in">
              <div className="text-center">
                <h2 className="text-2xl font-serif uppercase tracking-widest">Fitting Logistics</h2>
                <p className="text-zinc-500 text-sm mt-2">Finalize your {modalData.useCase} coordination.</p>
              </div>

              {modalData.useCase === 'Wedding' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-zinc-50 rounded-xl border-2 border-black/5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-2">
                      <Heart size={12} /> Wedding Date
                    </label>
                    <input type="date" className="w-full p-3 border rounded-md text-sm" value={weddingDate} onChange={(e) => setWeddingDate(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-2">
                      <Users size={12} /> Bridal Party Size
                    </label>
                    <select className="w-full p-3 border rounded-md text-sm" value={bridalPartyCount} onChange={(e) => setBridalPartyCount(e.target.value)}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <option key={n} value={n}>
                          {n} Person{n > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {modalData.useCase === 'Wedding' && (
                <div
                  className={`p-4 rounded-xl border text-sm ${
                    weddingProductionValidation.valid
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}
                >
                  <p className="font-semibold uppercase tracking-wider text-[10px] mb-1">Production Feasibility</p>
                  <p>{weddingProductionValidation.message}</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6">
                <div className="p-6 bg-zinc-50 rounded-xl border-2 border-black/5 space-y-3">
                  <label className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-2">
                    <Calendar size={12} /> Appointment Date
                  </label>
                  <input
                    type="date"
                    min={minBookingDate}
                    className="w-full p-4 border rounded-md text-sm bg-white"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedTime('');
                    }}
                  />
                  <p className="text-[9px] text-zinc-400 italic font-medium">
                    * Minimum notice based on service type policy ({serviceTypeMap[bookingServiceType]?.leadTimeHours ?? 48}h).
                  </p>
                </div>

                {['Home', 'Office', 'Location'].includes(modalData.appointmentMode) ? (
                  <div className="space-y-2 p-6 bg-zinc-50 rounded-xl border-2 border-black/5">
                    <label className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-2">
                      <MapPin size={12} /> Fitting Location Address
                    </label>
                    <textarea
                      placeholder="Please provide full street address..."
                      className="w-full p-3 border rounded-md text-sm min-h-[80px]"
                      value={onLocationAddress}
                      onChange={(e) => setOnLocationAddress(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="space-y-3 p-6 bg-zinc-50 rounded-xl border border-zinc-100">
                    <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Studio Location</label>
                    <select
                      value={studioLocationId}
                      onChange={(e) => setStudioLocationId(e.target.value)}
                      className="w-full p-3 border rounded-md text-sm bg-white"
                    >
                      {enabledLocations.map((locationOption) => (
                        <option key={locationOption.id} value={locationOption.id}>
                          {locationOption.label} - {locationOption.city}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-black text-white rounded-lg">
                        <MapPin size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Maison Location</p>
                        <p className="text-sm font-medium mt-1">{selectedStudioLocation?.address || STUDIO_LOCATION_FALLBACK}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div
                className={`border border-zinc-100 rounded-xl p-6 bg-[#F9F9F9] transition-all duration-500 ${
                  selectedDate ? 'opacity-100' : 'opacity-30 pointer-events-none'
                }`}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={12} className="text-zinc-400" />
                  <h4 className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Available Windows</h4>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {isCheckingAvailability && (
                    <p className="col-span-full text-sm text-zinc-500">Checking availability...</p>
                  )}

                  {!isCheckingAvailability && !availableSlots.length && (
                    <p className="col-span-full text-sm text-zinc-400">Select a date to load available windows.</p>
                  )}

                  {!isCheckingAvailability && availableSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`py-4 text-xs font-bold border rounded-sm transition-all ${
                        selectedTime === time ? 'bg-black text-white' : 'bg-white text-zinc-600 hover:border-black'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => confirmForFitting(selectedTime)}
                disabled={
                  !selectedTime ||
                  !selectedDate ||
                  isSaving ||
                  (modalData.useCase === 'Wedding' &&
                    (!weddingDate || (weddingProductionValidation.enforce && !weddingProductionValidation.valid))) ||
                  (['Home', 'Office', 'Location'].includes(modalData.appointmentMode) && !onLocationAddress)
                }
                className="w-full py-5 bg-black text-white rounded-sm font-bold uppercase tracking-[0.2em] disabled:bg-zinc-200 shadow-xl transition-all"
              >
                {isSaving ? 'Synchronizing Silhouette...' : 'Finalize & Secure Profile'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FitConfiguratorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="animate-spin text-zinc-300" size={48} />
        </div>
      }
    >
      <FitConfiguratorContent />
    </Suspense>
  );
}