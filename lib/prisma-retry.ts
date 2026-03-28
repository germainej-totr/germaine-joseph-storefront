type PrismaRetryOptions = {
  maxAttempts?: number;
  initialDelayMs?: number;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getPrismaErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
}

function isTransientPrismaError(error: unknown): boolean {
  const code = getPrismaErrorCode(error);
  return code === 'P1001' || code === 'P1002';
}

export async function withPrismaRetry<T>(
  operation: () => Promise<T>,
  options: PrismaRetryOptions = {},
): Promise<T> {
  const maxAttempts = Math.max(1, options.maxAttempts ?? 3);
  const initialDelayMs = Math.max(100, options.initialDelayMs ?? 500);

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isTransientPrismaError(error) || attempt === maxAttempts) {
        throw error;
      }

      const delayMs = initialDelayMs * attempt;
      await sleep(delayMs);
    }
  }

  throw lastError;
}