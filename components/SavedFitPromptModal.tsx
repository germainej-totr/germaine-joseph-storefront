'use client';

interface SavedFitPromptModalProps {
  isOpen: boolean;
  mode: 'saved_fit_eligible' | 'refit_recommended';
  lastUpdatedLabel: string;
  isLoading?: boolean;
  onUseSavedFit: () => void;
  onRequireNewFit: () => void;
  onClose: () => void;
}

export default function SavedFitPromptModal({
  isOpen,
  mode,
  lastUpdatedLabel,
  isLoading = false,
  onUseSavedFit,
  onRequireNewFit,
  onClose,
}: SavedFitPromptModalProps) {
  if (!isOpen) return null;

  const title =
    mode === 'refit_recommended'
      ? 'A Fit Refresh Is Recommended'
      : 'We Found Your Saved Fit Profile';

  const body =
    mode === 'refit_recommended'
      ? 'Your profile is older than 6 months. For precision tailoring, we recommend updating your measurements before checkout.'
      : 'Would you like to continue with your saved fit, or update your measurements?';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 text-black">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Germaine Joseph</p>
          <h2 className="mt-2 text-2xl font-serif">{title}</h2>
          <p className="mt-2 text-sm text-zinc-600">{body}</p>
          <p className="mt-3 text-xs text-zinc-500">Last updated: {lastUpdatedLabel}</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onUseSavedFit}
            disabled={isLoading}
            className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-left text-sm font-medium hover:border-zinc-500 disabled:opacity-60"
          >
            No changes, continue with saved fit
          </button>

          <button
            onClick={onRequireNewFit}
            disabled={isLoading}
            className="w-full rounded-lg bg-black px-4 py-3 text-left text-sm font-semibold text-white hover:bg-zinc-900 disabled:opacity-60"
          >
            Yes, I need a new fitting
          </button>
        </div>

        <button
          onClick={onClose}
          disabled={isLoading}
          className="mt-4 text-xs uppercase tracking-wider text-zinc-500 hover:text-zinc-900"
        >
          Close
        </button>
      </div>
    </div>
  );
}
