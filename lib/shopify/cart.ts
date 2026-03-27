import { shopifyStorefrontGraphQL } from '@/lib/shopify/storefront';

const CART_COOKIE_NAME = 'shopify_cart_id';

export interface ShopifyCartLine {
  id: string;
  quantity: number;
  attributes: Array<{ key: string; value: string }>;
  merchandise?: {
    id?: string;
    title?: string;
    product?: {
      title?: string;
      handle?: string;
    };
    image?: {
      url?: string;
      altText?: string;
    };
    price?: {
      amount?: string;
      currencyCode?: string;
    };
  };
}

export interface ShopifyCartPayload {
  id: string;
  checkoutUrl?: string;
  totalQuantity?: number;
  cost?: {
    subtotalAmount?: { amount?: string; currencyCode?: string };
    totalAmount?: { amount?: string; currencyCode?: string };
  };
  lines?: {
    edges?: Array<{ node: ShopifyCartLine }>;
  };
}

interface ShopifyGraphQLError {
  message?: string;
}

interface ShopifyMutationResult {
  cart?: ShopifyCartPayload;
  userErrors?: Array<{ message?: string }>;
}

interface StorefrontResponse<T> {
  data?: T;
  errors?: ShopifyGraphQLError[];
}

const CART_FRAGMENT = `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
      totalAmount {
        amount
        currencyCode
      }
    }
    lines(first: 50) {
      edges {
        node {
          id
          quantity
          attributes {
            key
            value
          }
          merchandise {
            ... on ProductVariant {
              id
              title
              price {
                amount
                currencyCode
              }
              image {
                url
                altText
              }
              product {
                title
                handle
              }
            }
          }
        }
      }
    }
  }
`;

export async function fetchShopifyCart(cartId: string): Promise<ShopifyCartPayload | null> {
  const query = `
    ${CART_FRAGMENT}
    query CartById($cartId: ID!) {
      cart(id: $cartId) {
        ...CartFields
      }
    }
  `;

  const response = await shopifyStorefrontGraphQL<StorefrontResponse<{ cart: ShopifyCartPayload | null }>>(query, { cartId });

  if (response?.errors?.length) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch cart');
  }

  return response?.data?.cart ?? null;
}

export async function createShopifyCart(input: {
  variantId: string;
  quantity?: number;
  attributes?: Array<{ key: string; value: string }>;
}): Promise<ShopifyCartPayload> {
  const mutation = `
    ${CART_FRAGMENT}
    mutation CreateCart($input: CartInput!) {
      cartCreate(input: $input) {
        cart {
          ...CartFields
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const response = await shopifyStorefrontGraphQL<StorefrontResponse<{ cartCreate: ShopifyMutationResult }>>(mutation, {
    input: {
      lines: [
        {
          merchandiseId: input.variantId,
          quantity: input.quantity ?? 1,
          attributes: input.attributes ?? [],
        },
      ],
    },
  });

  const userErrors = response?.data?.cartCreate?.userErrors;
  if (response?.errors?.length || (userErrors && userErrors.length > 0)) {
    const message = response?.errors?.[0]?.message || userErrors?.[0]?.message || 'Failed to create cart';
    throw new Error(message);
  }

  const cart = response?.data?.cartCreate?.cart;
  if (!cart?.id) {
    throw new Error('Cart creation returned no cart ID');
  }

  return cart;
}

export async function addLinesToShopifyCart(input: {
  cartId: string;
  variantId: string;
  quantity?: number;
  attributes?: Array<{ key: string; value: string }>;
}): Promise<ShopifyCartPayload> {
  const mutation = `
    ${CART_FRAGMENT}
    mutation AddLines($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          ...CartFields
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const response = await shopifyStorefrontGraphQL<StorefrontResponse<{ cartLinesAdd: ShopifyMutationResult }>>(mutation, {
    cartId: input.cartId,
    lines: [
      {
        merchandiseId: input.variantId,
        quantity: input.quantity ?? 1,
        attributes: input.attributes ?? [],
      },
    ],
  });

  const userErrors = response?.data?.cartLinesAdd?.userErrors;
  if (response?.errors?.length || (userErrors && userErrors.length > 0)) {
    const message = response?.errors?.[0]?.message || userErrors?.[0]?.message || 'Failed to add cart line';
    throw new Error(message);
  }

  const cart = response?.data?.cartLinesAdd?.cart;
  if (!cart?.id) {
    throw new Error('Cart line add returned no cart');
  }

  return cart;
}

export async function updateShopifyCartLine(input: {
  cartId: string;
  lineId: string;
  quantity: number;
}): Promise<ShopifyCartPayload> {
  const mutation = `
    ${CART_FRAGMENT}
    mutation UpdateLine($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart {
          ...CartFields
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const response = await shopifyStorefrontGraphQL<StorefrontResponse<{ cartLinesUpdate: ShopifyMutationResult }>>(mutation, {
    cartId: input.cartId,
    lines: [{ id: input.lineId, quantity: input.quantity }],
  });

  const userErrors = response?.data?.cartLinesUpdate?.userErrors;
  if (response?.errors?.length || (userErrors && userErrors.length > 0)) {
    const message = response?.errors?.[0]?.message || userErrors?.[0]?.message || 'Failed to update cart line';
    throw new Error(message);
  }

  const cart = response?.data?.cartLinesUpdate?.cart;
  if (!cart?.id) {
    throw new Error('Cart line update returned no cart');
  }

  return cart;
}

export async function removeShopifyCartLine(input: {
  cartId: string;
  lineId: string;
}): Promise<ShopifyCartPayload> {
  const mutation = `
    ${CART_FRAGMENT}
    mutation RemoveLine($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart {
          ...CartFields
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const response = await shopifyStorefrontGraphQL<StorefrontResponse<{ cartLinesRemove: ShopifyMutationResult }>>(mutation, {
    cartId: input.cartId,
    lineIds: [input.lineId],
  });

  const userErrors = response?.data?.cartLinesRemove?.userErrors;
  if (response?.errors?.length || (userErrors && userErrors.length > 0)) {
    const message = response?.errors?.[0]?.message || userErrors?.[0]?.message || 'Failed to remove cart line';
    throw new Error(message);
  }

  const cart = response?.data?.cartLinesRemove?.cart;
  if (!cart?.id) {
    throw new Error('Cart line removal returned no cart');
  }

  return cart;
}

export function parseCartIdFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${CART_COOKIE_NAME}=([^;]+)`));
  return match?.[1] ?? null;
}

export function getCartCookieName() {
  return CART_COOKIE_NAME;
}
