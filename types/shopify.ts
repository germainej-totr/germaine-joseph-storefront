export interface ShopifyProduct {
  id: string;
  handle: string;
  title: string;
  metafields: Record<string, unknown> | null; // Used to pull GJ namespace data
}

export interface CartLineInput {
  merchandiseId: string;
  quantity: number;
  attributes: { key: string; value: string }[];
}