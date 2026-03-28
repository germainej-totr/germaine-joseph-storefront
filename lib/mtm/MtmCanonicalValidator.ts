import {
  MTM_CANONICAL_PAYLOAD_SCHEMA,
  MTM_CANONICAL_PAYLOAD_STRICT_SCHEMA,
  type MtmCanonicalPayload,
} from './MtmCanonicalSchema.ts';
import {
  validateVersionCompatibility,
  MTM_CANONICAL_VERSION_CURRENT,
} from './MtmCanonicalVersion.ts';

/**
 * Validation result type
 */
export interface ValidationResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

/**
 * Validate a canonical MTM payload against the schema
 * Checks schema validity but allows missing version (defaults to current)
 *
 * @param payload Payload to validate
 * @returns Validation result with parsed payload or errors
 */
export function validateCanonicalPayload(payload: unknown): ValidationResult<MtmCanonicalPayload> {
  try {
    const result = MTM_CANONICAL_PAYLOAD_SCHEMA.safeParse(payload);

    if (!result.success) {
      const errorMap: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        if (!errorMap[path]) errorMap[path] = [];
        errorMap[path].push(issue.message);
      }

      return {
        ok: false,
        error: 'Payload validation failed',
        errors: errorMap,
      };
    }

    return {
      ok: true,
      data: result.data,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown validation error';
    return {
      ok: false,
      error: message,
    };
  }
}

/**
 * Validate a canonical MTM payload for persistence
 * Stricter than validateCanonicalPayload - requires version, id, and createdAt
 *
 * @param payload Payload to validate
 * @returns Validation result
 */
export function validateCanonicalPayloadForPersistence(
  payload: unknown,
): ValidationResult<MtmCanonicalPayload> {
  try {
    const result = MTM_CANONICAL_PAYLOAD_STRICT_SCHEMA.safeParse(payload);

    if (!result.success) {
      const errorMap: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        if (!errorMap[path]) errorMap[path] = [];
        errorMap[path].push(issue.message);
      }

      return {
        ok: false,
        error: 'Payload persistence validation failed',
        errors: errorMap,
      };
    }

    return {
      ok: true,
      data: result.data,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown validation error';
    return {
      ok: false,
      error: message,
    };
  }
}

/**
 * Validate payload version compatibility and apply migrations if needed
 *
 * @param payload Payload to validate
 * @returns Validation result with potential migration guidance
 */
export function validatePayloadWithVersionCheck(
  payload: unknown,
): ValidationResult<MtmCanonicalPayload> & { migration?: string } {
  // First validate schema
  const schemaValidation = validateCanonicalPayload(payload);
  if (!schemaValidation.ok) {
    return {
      ...schemaValidation,
      migration: undefined,
    };
  }

  // Then check version compatibility
  const payloadObj = payload as Record<string, unknown>;
  const version = (payloadObj.version as string) || MTM_CANONICAL_VERSION_CURRENT;

  const versionCheck = validateVersionCompatibility(version);
  if (!versionCheck.ok) {
    return {
      ok: false,
      error: versionCheck.error,
      migration: versionCheck.migration,
    };
  }

  return {
    ...schemaValidation,
    migration: undefined,
  };
}

/**
 * Ensure a payload has required fields for commerce operations
 *
 * @param payload Payload to check
 * @returns true if payload has fit profile, design, and mtm spec
 */
export function isPayloadReadyForCommerce(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false;

  const obj = payload as Record<string, unknown>;
  return !!(
    obj.fitProfile &&
    obj.design &&
    obj.mtmSpec &&
    typeof obj.mtmSpec === 'object' &&
    (obj.mtmSpec as Record<string, unknown>).category
  );
}

/**
 * Ensure a payload has required fields for fulfilment
 *
 * @param payload Payload to check
 * @returns true if payload has fit profile ID, category, and measurements
 */
export function isPayloadReadyForFulfilment(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false;

  const obj = payload as Record<string, unknown>;
  const fitProfile = obj.fitProfile as Record<string, unknown>;
  const mtmSpec = obj.mtmSpec as Record<string, unknown>;

  return !!(
    fitProfile?.fitProfileId &&
    obj.category &&
    mtmSpec?.measurements &&
    typeof mtmSpec.measurements === 'object' &&
    Object.keys(mtmSpec.measurements).length > 0
  );
}

/**
 * Extract version from a payload object
 *
 * @param payload Payload object
 * @returns Version string or default current version
 */
export function extractPayloadVersion(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return MTM_CANONICAL_VERSION_CURRENT;

  const version = (payload as Record<string, unknown>).version;
  return typeof version === 'string' ? version : MTM_CANONICAL_VERSION_CURRENT;
}

/**
 * Get human-readable validation errors from a payload
 *
 * @param validation Validation result with errors
 * @returns Formatted error message
 */
export function formatValidationErrors(validation: ValidationResult<any>): string {
  if (validation.ok) return '';

  if (validation.error && !validation.errors) {
    return validation.error;
  }

  if (validation.errors) {
    const errorLines = Object.entries(validation.errors)
      .map(([field, messages]) => `  ${field}: ${messages.join(', ')}`)
      .join('\n');

    return `${validation.error || 'Validation failed'}:\n${errorLines}`;
  }

  return 'Unknown validation error';
}
