'use client';

import { useCallback, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import SuitRedLabelController from '@/src/components/mtm/SuitRedLabelController';
import type { SuitRedLabelSelections } from '@/src/lib/mtm/suitRedLabelOptions';
import type { CanonicalPayload } from '@/src/components/mtm/SuitRedLabelController';

const SUIT_RED_LABEL_DRAFT_KEY = 'gjm_suit_red_label_draft';
const SUIT_RED_LABEL_HANDOFF_KEY = 'gjm_suit_red_label_handoff';

export default function SuitRedLabelConfigurePage() {
  const router = useRouter();
  const [pageStatus, setPageStatus] = useState<string>('');

  const initialSelections = useMemo<SuitRedLabelSelections>(
    () => ({
      production: 'sartoria_red_label',
    }),
    [],
  );

  const handleSaveDraft = useCallback(async (payload: CanonicalPayload) => {
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(
          SUIT_RED_LABEL_DRAFT_KEY,
          JSON.stringify(payload.selections),
        );

        window.sessionStorage.setItem(
          SUIT_RED_LABEL_HANDOFF_KEY,
          JSON.stringify({
            source: 'configure_suit_red_label',
            category: payload.category,
            optionSet: payload.optionSet,
            optionSetVersion: payload.optionSetVersion,
            production: payload.production,
            selections: payload.selections,
            pricing: payload.pricing,
            summary: payload.summary,
            validation: payload.validation,
            savedAt: new Date().toISOString(),
          }),
        );
      }

      setPageStatus('Draft saved successfully.');
    } catch (error) {
      console.error('Failed to save suit red label draft', error);
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
          SUIT_RED_LABEL_DRAFT_KEY,
          JSON.stringify(payload.selections),
        );

        window.sessionStorage.setItem(
          SUIT_RED_LABEL_HANDOFF_KEY,
          JSON.stringify({
            source: 'configure_suit_red_label',
            category: payload.category,
            optionSet: payload.optionSet,
            optionSetVersion: payload.optionSetVersion,
            production: payload.production,
            selections: payload.selections,
            pricing: payload.pricing,
            summary: payload.summary,
            validation: payload.validation,
            continuedAt: new Date().toISOString(),
          }),
        );
      }

      setPageStatus('Configuration saved. Redirecting to fit...');
      router.push('/configure-fit?category=suit&production=sartoria_red_label');
    } catch (error) {
      console.error('Failed to continue from suit red label configurator', error);
      setPageStatus('Unable to continue to the next step.');
    }
  }, [router]);

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.pageHeader}>
          <div>
            <p style={styles.eyebrow}>Configure Your Garment</p>
            <h1 style={styles.title}>Sartoria Red Label Suit</h1>
            <p style={styles.subtitle}>
              Configure your Red Label jacket and trouser details before moving into the fit stage.
            </p>
          </div>
        </div>

        <SuitRedLabelController
          initialSelections={initialSelections}
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