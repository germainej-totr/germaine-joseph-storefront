/**
 * MTM Canonical Payload Versioning
 *
 * Defines the version contract for MTM payloads across all systems.
 * Used for payload validation, schema evolution, and migration strategies.
 */

/**
 * Current stable version of canonical MTM payload
 */
export const MTM_CANONICAL_VERSION_CURRENT = 'v1';

/**
 * All supported canonical payload versions
 */
export const MTM_CANONICAL_VERSIONS = ['v1'] as const;

export type MtmCanonicalPayloadVersion = (typeof MTM_CANONICAL_VERSIONS)[number];

/**
 * Version metadata with support information
 */
export interface MtmVersionMetadata {
  version: MtmCanonicalPayloadVersion;
  releaseDate: string;
  status: 'stable' | 'deprecated' | 'preview';
  description: string;
  breakingChangesFrom?: MtmCanonicalPayloadVersion;
}

/**
 * Version metadata database
 */
export const MTM_VERSION_METADATA: Record<MtmCanonicalPayloadVersion, MtmVersionMetadata> = {
  v1: {
    version: 'v1',
    releaseDate: '2026-03-28',
    status: 'stable',
    description:
      'Initial canonical MTM payload standard with fit profile, design snapshot, measurements, and MTM spec',
    breakingChangesFrom: undefined,
  },
};

/**
 * Check if a version is currently supported
 */
export function isSupportedVersion(version: string): version is MtmCanonicalPayloadVersion {
  return MTM_CANONICAL_VERSIONS.includes(version as MtmCanonicalPayloadVersion);
}

/**
 * Get version metadata
 */
export function getVersionMetadata(
  version: MtmCanonicalPayloadVersion,
): MtmVersionMetadata {
  return MTM_VERSION_METADATA[version];
}

/**
 * Check if a version is stable and safe to use
 */
export function isStableVersion(version: MtmCanonicalPayloadVersion): boolean {
  return getVersionMetadata(version).status === 'stable';
}

/**
 * Validate that a payload version is compatible with current system
 * Returns { ok: true } if compatible, { ok: false, error, migration? } if migration needed
 */
export function validateVersionCompatibility(
  payloadVersion: string,
): { ok: true } | { ok: false; error: string; migration?: string } {
  if (!isSupportedVersion(payloadVersion)) {
    return {
      ok: false,
      error: `Unsupported MTM payload version: ${payloadVersion}`,
    };
  }

  const metadata = getVersionMetadata(payloadVersion);
  if (metadata.status === 'deprecated') {
    return {
      ok: false,
      error: `MTM payload version ${payloadVersion} is deprecated. Use ${MTM_CANONICAL_VERSION_CURRENT}`,
      migration: `Please upgrade payload to ${MTM_CANONICAL_VERSION_CURRENT}`,
    };
  }

  return { ok: true };
}
