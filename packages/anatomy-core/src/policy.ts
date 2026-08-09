import type { BundleManifest, GeometryBinding, LicenseRecord, ReleasePolicy } from './schemas';

/**
 * License gates are enforced by data, before geometry bytes are exposed.
 * A blocked node must be omitted from external/commercial builds; QA pass
 * status is never treated as license approval.
 */

export function isLicenseAllowed(license: LicenseRecord, policy: ReleasePolicy): boolean {
  if (policy === 'internal_development') return true;
  if (license.status === 'blocked_distribution') return false;
  if (license.status === 'pending_review') return false;
  return license.allowed_policies.includes(policy);
}

export function isBindingAllowed(binding: GeometryBinding, policy: ReleasePolicy): boolean {
  return isLicenseAllowed(binding.license, policy);
}

export interface PolicyViolation {
  bundle_id: string;
  geometry_id: string;
  structure_id: string;
  license_status: LicenseRecord['status'];
  message: string;
}

/**
 * Returns every binding that must NOT ship under the given policy. An
 * external/commercial release build fails when this list is non-empty,
 * because the GLB bytes for these nodes would otherwise still be shipped.
 */
export function findPolicyViolations(
  manifests: BundleManifest[],
  policy: ReleasePolicy,
): PolicyViolation[] {
  if (policy === 'internal_development') return [];
  const violations: PolicyViolation[] = [];
  for (const manifest of manifests) {
    for (const binding of manifest.bindings) {
      if (!isBindingAllowed(binding, policy)) {
        violations.push({
          bundle_id: manifest.bundle_id,
          geometry_id: binding.geometry_id,
          structure_id: binding.structure_id,
          license_status: binding.license.status,
          message: `geometry "${binding.geometry_id}" (structure "${binding.structure_id}") has license status "${binding.license.status}" and is not cleared for policy "${policy}"`,
        });
      }
    }
  }
  return violations;
}
