'use client';

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import SuitBlackLabelController from '@/src/components/mtm/SuitBlackLabelController';
import type { CanonicalPayload } from '@/src/components/mtm/SuitBlackLabelController';

type SuitBlackLabelSelections = Record<string, string | string[] | undefined>;

type HandoffRecord = CanonicalPayload & {
  source?: string;
  savedAt?: string;
  continuedAt?: string;
};

const SUIT_BLACK_LABEL_DRAFT_KEY = 'gjm_suit_black_label_draft';
const SUIT_BLACK_LABEL_HANDOFF_KEY = 'gjm_suit_black_label_handoff';
const DRAFT_API_ENDPOINT = '/api/mtm/suit-black-label/draft';

async function persistDraftToApi(payload: CanonicalPayload): Promise<boolean> {
  try {
    const response = await fetch(DRAFT_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch {
    return false;
  }
}

export default function SuitBlackLabelConfigurePage() {
  const router = useRouter();
  const [pageStatus, setPageStatus] = useState('');
  const [hydratedSelections, setHydratedSelections] = useState<SuitBlackLabelSelections | null>(null);

  const initialSelections = useMemo<SuitBlackLabelSelections>(
    () => ({
      production: 'sartoria_black_label',
    }),
    [],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const handoffRaw = window.sessionStorage.getItem(SUIT_BLACK_LABEL_HANDOFF_KEY);
      if (!handoffRaw) return;

      const handoff = JSON.parse(handoffRaw) as HandoffRecord;
      if (!handoff.selections || typeof handoff.selections !== 'object') return;

      setHydratedSelections(handoff.selections);
      setPageStatus('Loaded previous suit black label draft from handoff.');
    } catch {
      // Ignore malformed handoff payloads and fall back to defaults.
    }
  }, []);

  const handleSaveDraft = useCallback(async (payload: CanonicalPayload) => {
    try {
      const persistedToApi = await persistDraftToApi(payload);

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(
          SUIT_BLACK_LABEL_DRAFT_KEY,
          JSON.stringify(payload.selections),
        );

        window.sessionStorage.setItem(
          SUIT_BLACK_LABEL_HANDOFF_KEY,
          JSON.stringify({
            source: 'configure_suit_black_label',
            category: payload.category,
            optionSet: payload.optionSet,
            optionSetVersion: payload.optionSetVersion,
            production: payload.production,
            selections: payload.selections,
            pricing: payload.pricing,
            validation: payload.validation,
            savedAt: new Date().toISOString(),
          }),
        );
      }

      setPageStatus(
        persistedToApi
          ? 'Draft saved successfully.'
          : 'Draft saved locally. Remote draft API not available yet.',
      );
    } catch (error) {
      console.error('Failed to save suit black label draft', error);
      setPageStatus('Unable to save draft.');
    }
  }, []);

  const handleContinue = useCallback(async (payload: CanonicalPayload) => {
    try {
      if (!payload.validation.isValid) {
        setPageStatus('Please complete all required selections before continuing.');
        return;
      }

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(
          SUIT_BLACK_LABEL_DRAFT_KEY,
          JSON.stringify(payload.selections),
        );

        window.sessionStorage.setItem(
          SUIT_BLACK_LABEL_HANDOFF_KEY,
          JSON.stringify({
            source: 'configure_suit_black_label',
            category: payload.category,
            optionSet: payload.optionSet,
            optionSetVersion: payload.optionSetVersion,
            production: payload.production,
            selections: payload.selections,
            pricing: payload.pricing,
            validation: payload.validation,
            continuedAt: new Date().toISOString(),
          }),
        );
      }

      setPageStatus('Configuration saved. Redirecting to fit...');
      router.push('/configure-fit?category=suit&production=sartoria_black_label');
    } catch (error) {
      console.error('Failed to continue from suit black label configurator', error);
      setPageStatus('Unable to continue to the next step.');
    }
  }, [router]);

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.pageHeader}>
          <div>
            <p style={styles.eyebrow}>Configure Your Garment</p>
            <h1 style={styles.title}>Sartoria Black Label Suit</h1>
            <p style={styles.subtitle}>
              Build your jacket and trouser design before moving into the fit stage.
            </p>
          </div>
        </div>

        <SuitBlackLabelController
          initialSelections={hydratedSelections ?? initialSelections}
          currencySymbol="$"
          onSaveDraft={handleSaveDraft}
          onContinue={handleContinue}
        />

        {pageStatus ? <div style={styles.status}>{pageStatus}</div> : null}
      </div>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#fff',
  },
  container: {
    maxWidth: 1440,
    margin: '0 auto',
    padding: '32px 20px 56px',
  },
  pageHeader: {
    marginBottom: 24,
  },
  eyebrow: {
    margin: 0,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#666',
  },
  title: {
    margin: '8px 0 10px',
    fontSize: 36,
    lineHeight: 1.05,
    fontWeight: 700,
    color: '#111',
  },
  subtitle: {
    margin: 0,
    maxWidth: 720,
    fontSize: 15,
    lineHeight: 1.6,
    color: '#555',
  },
  status: {
    marginTop: 18,
    fontSize: 14,
    color: '#444',
  },
};