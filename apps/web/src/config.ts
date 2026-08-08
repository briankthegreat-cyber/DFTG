import { ReleasePolicySchema, type ReleasePolicy } from '@anatomy/core';

/** Environment-driven configuration; see .env.example at the repo root. */

export const ASSET_BASE_URL: string =
  (import.meta.env.VITE_ANATOMY_ASSET_BASE_URL as string | undefined) ?? '/anatomy';

function parsePolicy(raw: string | undefined): ReleasePolicy {
  const parsed = ReleasePolicySchema.safeParse(raw);
  return parsed.success ? parsed.data : 'internal_development';
}

export const RELEASE_POLICY: ReleasePolicy = parsePolicy(
  import.meta.env.VITE_ANATOMY_RELEASE_POLICY as string | undefined,
);

export const VERIFY_HASHES: boolean =
  (import.meta.env.VITE_ANATOMY_VERIFY_HASHES as string | undefined) === '1';

export const IS_DEV: boolean = import.meta.env.DEV;
