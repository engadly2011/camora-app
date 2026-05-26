// ─────────────────────────────────────────────────────────────────────────────
// Analytics — Plausible.io (privacy-first, no cookies, GDPR compliant)
//
// Why Plausible over PostHog:
//   - 1 script tag, zero config, no SDK to install
//   - No cookies → no cookie banner required
//   - GDPR compliant out of the box
//   - Free tier covers up to 10k pageviews/month
//   - Events are a simple fetch call — no bundle impact
//
// All functions are no-ops when:
//   - window is undefined (SSR)
//   - NEXT_PUBLIC_PLAUSIBLE_DOMAIN is not set
//   - Running on localhost
// ─────────────────────────────────────────────────────────────────────────────

type PlausibleFn = (
  event: string,
  options?: { props?: Record<string, string | number | boolean> }
) => void;

declare global {
  interface Window {
    plausible?: PlausibleFn;
  }
}

function track(event: string, props?: Record<string, string | number | boolean>) {
  if (typeof window === 'undefined') return;
  if (!window.plausible) return;
  window.plausible(event, props ? { props } : undefined);
}

// ── Named events ──────────────────────────────────────────────────────────────

export const analytics = {
  /** Fired when user opens the calculator from the landing page */
  calculatorOpened(source: 'hero_cta' | 'nav_button' | 'seo_page') {
    track('Calculator Opened', { source });
  },

  /** Fired when any calculator field changes */
  calculatorUsed() {
    track('Calculator Used');
  },

  /** Fired when user clicks Copy Share Link */
  shareLinkCopied() {
    track('Share Link Copied');
  },

  /** Fired when user clicks Export PDF (before the modal) */
  pdfExportStarted() {
    track('PDF Export Started');
  },

  /** Fired when PDF generation completes successfully */
  pdfExportCompleted() {
    track('PDF Export Completed');
  },

  /** Fired when a scenario preset is selected */
  presetSelected(presetId: string) {
    track('Preset Selected', { preset: presetId });
  },

  /** Fired when user opens Advanced Options accordion */
  advancedOptionsOpened() {
    track('Advanced Options Opened');
  },
} as const;
