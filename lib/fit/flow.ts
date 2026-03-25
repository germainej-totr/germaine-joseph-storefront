export interface SearchParamsLike {
  get(name: string): string | null;
}

function safeLocalPath(value: string | null): string | null {
  if (!value) return null;

  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    decoded = value;
  }

  if (!decoded.startsWith('/')) return null;
  if (decoded.startsWith('//')) return null;
  return decoded;
}

export function resolvePostFitDestination(
  searchParams: SearchParamsLike,
  options?: {
    email?: string;
    defaultPath?: string;
  },
): string {
  const returnTo = safeLocalPath(searchParams.get('returnTo'));
  if (returnTo) return returnTo;

  const checkoutRedirectTo = safeLocalPath(searchParams.get('checkoutRedirectTo'));
  if (checkoutRedirectTo) return checkoutRedirectTo;

  const defaultPath = options?.defaultPath || '/fit/book';
  const email = options?.email?.trim();

  if (!email || !defaultPath.startsWith('/fit/book')) {
    return defaultPath;
  }

  const query = new URLSearchParams();
  query.set('email', email);

  const profileName = searchParams.get('profileName');
  if (profileName) query.set('profileName', profileName);

  const productHandle = searchParams.get('productHandle');
  if (productHandle) query.set('productHandle', productHandle);

  const productTitle = searchParams.get('productTitle');
  if (productTitle) query.set('productTitle', productTitle);

  const variantId = searchParams.get('variantId');
  if (variantId) query.set('variantId', variantId);

  const useCase = searchParams.get('primaryUseCase');
  if (useCase) query.set('useCase', useCase);

  return `${defaultPath}?${query.toString()}`;
}
