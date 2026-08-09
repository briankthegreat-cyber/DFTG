import { describe, expect, it } from 'vitest';
import { findPolicyViolations, isBindingAllowed } from './policy';
import { makeBinding, makeManifest } from './testing';

const blockedBinding = makeBinding({
  geometry_id: 'TEST-G-BLOCKED',
  structure_id: 'TEST-S-BLOCKED',
  license: { status: 'blocked_distribution', allowed_policies: [] },
});

const pendingBinding = makeBinding({
  geometry_id: 'TEST-G-PENDING',
  structure_id: 'TEST-S-PENDING',
  license: {
    status: 'pending_review',
    allowed_policies: ['external_preview', 'commercial_release'],
  },
});

const fixtureBinding = makeBinding({
  geometry_id: 'TEST-G-FIXTURE',
  structure_id: 'TEST-S-FIXTURE',
  license: {
    status: 'development_fixture',
    allowed_policies: ['internal_development', 'external_preview'],
  },
});

describe('isBindingAllowed', () => {
  it('allows blocked_distribution only under internal_development', () => {
    expect(isBindingAllowed(blockedBinding, 'internal_development')).toBe(true);
    expect(isBindingAllowed(blockedBinding, 'external_preview')).toBe(false);
    expect(isBindingAllowed(blockedBinding, 'commercial_release')).toBe(false);
  });

  it('denies pending_review externally even when allowed_policies claims otherwise', () => {
    expect(isBindingAllowed(pendingBinding, 'internal_development')).toBe(true);
    expect(isBindingAllowed(pendingBinding, 'external_preview')).toBe(false);
    expect(isBindingAllowed(pendingBinding, 'commercial_release')).toBe(false);
  });

  it('allows development_fixture per its allowed_policies', () => {
    expect(isBindingAllowed(fixtureBinding, 'internal_development')).toBe(true);
    expect(isBindingAllowed(fixtureBinding, 'external_preview')).toBe(true);
    expect(isBindingAllowed(fixtureBinding, 'commercial_release')).toBe(false);
  });
});

describe('findPolicyViolations', () => {
  const approvedBinding = makeBinding({
    geometry_id: 'TEST-G-APPROVED',
    structure_id: 'TEST-S-APPROVED',
    license: {
      status: 'approved',
      allowed_policies: ['internal_development', 'external_preview', 'commercial_release'],
    },
  });
  const manifests = [
    makeManifest({ bundle_id: 'bundle-mixed', bindings: [approvedBinding, blockedBinding] }),
  ];

  it('returns [] under internal_development even with blocked bindings present', () => {
    expect(findPolicyViolations(manifests, 'internal_development')).toEqual([]);
  });

  it('returns exactly the blocked binding under external_preview', () => {
    const violations = findPolicyViolations(manifests, 'external_preview');
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({
      bundle_id: 'bundle-mixed',
      geometry_id: 'TEST-G-BLOCKED',
      structure_id: 'TEST-S-BLOCKED',
      license_status: 'blocked_distribution',
    });
  });
});
