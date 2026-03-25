type RateLimitOptions = {
  maxRequests: number;
  windowMs: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

type BucketStore = Map<string, number[]>;

declare global {
  // eslint-disable-next-line no-var
  var __gjm_auth_rate_limit_store: BucketStore | undefined;
}

function getStore(): BucketStore {
  if (!globalThis.__gjm_auth_rate_limit_store) {
    globalThis.__gjm_auth_rate_limit_store = new Map<string, number[]>();
  }

  return globalThis.__gjm_auth_rate_limit_store;
}

export function getRequestClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  return request.headers.get('x-real-ip') || 'unknown';
}

export function consumeRateLimit(
  key: string,
  options: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  const floor = now - options.windowMs;
  const store = getStore();
  const existing = store.get(key) || [];
  const recent = existing.filter((timestamp) => timestamp > floor);

  if (recent.length >= options.maxRequests) {
    const oldest = recent[0] || now;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + options.windowMs - now) / 1000));
    store.set(key, recent);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  recent.push(now);
  store.set(key, recent);

  return {
    allowed: true,
    remaining: Math.max(0, options.maxRequests - recent.length),
    retryAfterSeconds: 0,
  };
}

export class TimeoutError extends Error {
  code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
    this.name = 'TimeoutError';
  }
}

export async function withTimeout<T>(
  action: () => Promise<T>,
  timeoutMs: number,
  timeoutCode: string,
): Promise<T> {
  return await new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new TimeoutError(timeoutCode));
    }, timeoutMs);

    action()
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}
