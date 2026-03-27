import type { ProductSummary } from '@/types/fit';

export interface ProductListCollectionMeta {
  handle: string;
  title: string;
}

export interface ProductListResponse {
  products: ProductSummary[];
  collection: ProductListCollectionMeta | null;
  error?: string;
  details?: unknown;
}

export interface ProductOption {
  id?: string;
  name: string;
  values: string[];
}

export interface ProductVariant {
  id: string;
  title?: string;
  availableForSale?: boolean;
  selectedOptions?: Array<{ name: string; value: string }>;
  price?: {
    amount?: string;
    currencyCode?: string;
  };
  image?: {
    url?: string;
    altText?: string;
  };
}

export interface ProductDetail {
  id: string;
  title?: string;
  handle: string;
  productType?: string;
  descriptionHtml?: string;
  options?: ProductOption[];
  variants?: { edges?: Array<{ node?: ProductVariant }> };
  mtm_required?: { value?: unknown };
  mtm_category?: { value?: string };
  [key: string]: unknown;
}

export interface ProductDetailResponse {
  product: ProductDetail | null;
  error?: string;
}
