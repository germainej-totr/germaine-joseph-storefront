import type { ProductSummary } from '@/types/fit';

export type HomeProductCardAction = 'open_fit_gate' | 'open_product';

export interface HomeProductCardFlow {
  isMTM: boolean;
  badgeLabel: string;
  helperText: string;
  ctaLabel: string;
  action: HomeProductCardAction;
  href?: string;
}

export function resolveHomeProductCardFlow(product: ProductSummary): HomeProductCardFlow {
  const isMTM = Boolean(product.mtmRequired);

  if (isMTM) {
    return {
      isMTM: true,
      badgeLabel: 'Custom MTM',
      helperText: 'Click to start your fit journey',
      ctaLabel: 'Create Fit Profile',
      action: 'open_fit_gate',
    };
  }

  return {
    isMTM: false,
    badgeLabel: 'Ready to Wear',
    helperText: 'Click to view product options',
    ctaLabel: 'View Product',
    action: 'open_product',
    href: `/p/${product.handle}`,
  };
}