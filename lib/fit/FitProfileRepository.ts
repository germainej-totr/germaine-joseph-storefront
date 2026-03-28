import 'server-only';

import { Prisma } from '@prisma/client';

import prisma from '@/lib/prisma';
import type {
  FitProfileCreateInput,
  FitProfileSummary,
  FitProfileUpdateInput,
} from '@/lib/fit/FitProfileSchema';

type FitProfileOwner = {
  email: string;
  customerId?: string | null;
};

type FitProfileRow = {
  id: string;
  profile_name: string | null;
  customerId: string | null;
  email: string;
  jacketSize: string | null;
  trouserSize: string | null;
  fitPreference: string | null;
  appointmentDate: string | null;
  appointmentTime: string | null;
  technicalSpecs: unknown;
  isActive: boolean;
  updatedAt: Date;
};

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function toPrismaJson(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === null || value === undefined) {
    return Prisma.JsonNull;
  }
  return value as Prisma.InputJsonValue;
}

function getVersion(technicalSpecs: unknown): number {
  const record = asRecord(technicalSpecs);
  const raw = record.fitProfileVersion;
  return typeof raw === 'number' && Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1;
}

function mergeTechnicalSpecs(existing: unknown, incoming: Record<string, unknown> | undefined) {
  const current = asRecord(existing);
  const nextIncoming = incoming || {};
  const nextVersion = Object.keys(current).length === 0 ? 1 : getVersion(current) + 1;

  return {
    ...current,
    ...nextIncoming,
    attributes: {
      ...asRecord(current.attributes),
      ...asRecord(nextIncoming.attributes),
    },
    preferences: {
      ...asRecord(current.preferences),
      ...asRecord(nextIncoming.preferences),
    },
    fitProfileVersion: nextVersion,
    fitProfileUpdatedAt: new Date().toISOString(),
  };
}

function toSummary(row: FitProfileRow): FitProfileSummary {
  return {
    id: row.id,
    label: row.profile_name || 'Saved profile',
    customerId: row.customerId || undefined,
    email: row.email,
    categoryDefaults: {
      jacket: { size: row.jacketSize },
      trouser: { size: row.trouserSize },
    },
    fitPreference: row.fitPreference,
    appointmentDate: row.appointmentDate,
    appointmentTime: row.appointmentTime,
    technicalSpecs: row.technicalSpecs,
    isActive: row.isActive,
    updatedAt: row.updatedAt.toISOString(),
    version: getVersion(row.technicalSpecs),
  };
}

function buildOwnerWhere(owner: FitProfileOwner): Prisma.FitProfileWhereInput {
  return {
    isActive: true,
    OR: [
      ...(owner.customerId ? [{ customerId: owner.customerId }] : []),
      { email: owner.email },
    ],
  };
}

const fitProfileSelect = {
  id: true,
  profile_name: true,
  customerId: true,
  email: true,
  jacketSize: true,
  trouserSize: true,
  fitPreference: true,
  appointmentDate: true,
  appointmentTime: true,
  technicalSpecs: true,
  isActive: true,
  updatedAt: true,
} satisfies Prisma.FitProfileSelect;

export const FitProfileRepository = {
  async listOwnedProfiles(owner: FitProfileOwner): Promise<FitProfileSummary[]> {
    const rows = await prisma.fitProfile.findMany({
      where: buildOwnerWhere(owner),
      select: fitProfileSelect,
      orderBy: { updatedAt: 'desc' },
    });

    return rows.map((row) => toSummary(row as FitProfileRow));
  },

  async findOwnedProfileById(id: string, owner: FitProfileOwner): Promise<FitProfileSummary | null> {
    const row = await prisma.fitProfile.findFirst({
      where: {
        id,
        ...buildOwnerWhere(owner),
      },
      select: fitProfileSelect,
    });

    return row ? toSummary(row as FitProfileRow) : null;
  },

  async saveProfile(owner: FitProfileOwner, input: FitProfileCreateInput): Promise<FitProfileSummary> {
    const existing = await prisma.fitProfile.findUnique({
      where: { email: owner.email },
      select: fitProfileSelect,
    });

    const categoryDefaults = input.categoryDefaults || {};
    const mergedTechnicalSpecs = mergeTechnicalSpecs(existing?.technicalSpecs, input.technicalSpecs);

    const row = existing
      ? await prisma.fitProfile.update({
          where: { email: owner.email },
          data: {
            customerId: owner.customerId || existing.customerId,
            profile_name: input.label || existing.profile_name || 'Saved profile',
            jacketSize: categoryDefaults.jacket?.size ?? existing.jacketSize,
            trouserSize: categoryDefaults.trouser?.size ?? existing.trouserSize,
            fitPreference: input.fitPreference ?? existing.fitPreference,
            appointmentDate: input.appointmentDate ?? existing.appointmentDate,
            appointmentTime: input.appointmentTime ?? existing.appointmentTime,
            technicalSpecs: toPrismaJson(mergedTechnicalSpecs),
            isActive: true,
          },
          select: fitProfileSelect,
        })
      : await prisma.fitProfile.create({
          data: {
            email: owner.email,
            customerId: owner.customerId || null,
            profile_name: input.label || 'Saved profile',
            jacketSize: categoryDefaults.jacket?.size ?? null,
            trouserSize: categoryDefaults.trouser?.size ?? null,
            fitPreference: input.fitPreference ?? null,
            appointmentDate: input.appointmentDate ?? null,
            appointmentTime: input.appointmentTime ?? null,
            technicalSpecs: toPrismaJson(mergedTechnicalSpecs),
            isActive: true,
          },
          select: fitProfileSelect,
        });

    return toSummary(row as FitProfileRow);
  },

  async updateOwnedProfile(
    id: string,
    owner: FitProfileOwner,
    input: FitProfileUpdateInput,
  ): Promise<FitProfileSummary | null> {
    const existing = await prisma.fitProfile.findFirst({
      where: {
        id,
        ...buildOwnerWhere(owner),
      },
      select: fitProfileSelect,
    });

    if (!existing) {
      return null;
    }

    const categoryDefaults = input.categoryDefaults || {};
    const mergedTechnicalSpecs = input.technicalSpecs
      ? mergeTechnicalSpecs(existing.technicalSpecs, input.technicalSpecs)
      : existing.technicalSpecs;

    const row = await prisma.fitProfile.update({
      where: { id },
      data: {
        profile_name: input.label ?? existing.profile_name,
        jacketSize: categoryDefaults.jacket?.size ?? existing.jacketSize,
        trouserSize: categoryDefaults.trouser?.size ?? existing.trouserSize,
        fitPreference: input.fitPreference === undefined ? existing.fitPreference : input.fitPreference,
        appointmentDate: input.appointmentDate ?? existing.appointmentDate,
        appointmentTime: input.appointmentTime ?? existing.appointmentTime,
        technicalSpecs: toPrismaJson(mergedTechnicalSpecs),
        isActive: input.isActive ?? existing.isActive,
        customerId: owner.customerId || existing.customerId,
      },
      select: fitProfileSelect,
    });

    return toSummary(row as FitProfileRow);
  },
};
