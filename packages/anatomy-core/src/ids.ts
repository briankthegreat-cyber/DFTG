/**
 * Stable identifier rules.
 *
 * `structure_id` and `geometry_id` are the permanent application identities.
 * Business logic must never key off display names or raw glTF node names.
 * The pattern is deliberately permissive so future real production IDs
 * (TA2-derived or otherwise) are not rejected by the client.
 */
export const COORDINATE_SYSTEM_ID = 'ANAT_CANONICAL_LSA_YUP_M_V1_1' as const;
export type CoordinateSystemId = typeof COORDINATE_SYSTEM_ID;

export const STABLE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/;

export function isValidStableId(id: string): boolean {
  return STABLE_ID_PATTERN.test(id);
}

export const SHA256_PATTERN = /^[a-f0-9]{64}$/;
