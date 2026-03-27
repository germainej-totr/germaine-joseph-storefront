// lib/utils.ts

/**
 * Ensures consistent formatting for MTM attributes before 
 * they hit the Shopify Cart (which requires JSON strings)
 */
export function formatMtmAttributes(data: Record<string, unknown>) {
  return JSON.stringify(data);
}

/**
 * Formats Shopify Money objects into localized currency strings
 */
export function formatMoney(amount: string, currencyCode: string = "AUD") {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: currencyCode,
  }).format(parseFloat(amount));
}

/**
 * Standardized response wrapper for API routes
 */
export function apiResponse<T>(data: T, status: number = 200) {
  return Response.json(data, { status });
}