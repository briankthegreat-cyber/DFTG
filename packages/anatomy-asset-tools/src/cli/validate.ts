import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ReleasePolicySchema } from '@anatomy/core';
import type { ReleasePolicy } from '@anatomy/core';
import { validateAssets } from '../validate-lib';
import type { Finding } from '../validate-lib';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..', '..', '..', '..');

function argValue(args: string[], flag: string): string | undefined {
  const flagIndex = args.indexOf(flag);
  if (flagIndex === -1) return undefined;
  const value = args[flagIndex + 1];
  if (value === undefined) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

function formatFinding(finding: Finding): string {
  const details: string[] = [];
  if (finding.bundle_id !== undefined) details.push(`bundle=${finding.bundle_id}`);
  if (finding.path !== undefined) details.push(`path=${finding.path}`);
  if (finding.expected !== undefined) details.push(`expected=${finding.expected}`);
  if (finding.actual !== undefined) details.push(`actual=${finding.actual}`);
  const suffix = details.length > 0 ? ` (${details.join(', ')})` : '';
  return `[${finding.code}] ${finding.message}${suffix}`;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2).filter((a) => a !== '--');

  const dirArg = argValue(args, '--dir');
  const dir =
    dirArg !== undefined
      ? path.resolve(dirArg)
      : path.join(repoRoot, 'apps', 'web', 'public', 'anatomy');

  const policyRaw = argValue(args, '--policy') ?? 'internal_development';
  const policyParsed = ReleasePolicySchema.safeParse(policyRaw);
  if (!policyParsed.success) {
    throw new Error(
      `invalid --policy "${policyRaw}"; expected one of: ${ReleasePolicySchema.options.join(', ')}`,
    );
  }
  const policy: ReleasePolicy = policyParsed.data;

  console.log(`validating ${dir} under policy "${policy}"`);
  const report = await validateAssets({ dir, policy });

  const statsLine = Object.entries(report.stats)
    .map(([key, value]) => `${key}=${value}`)
    .join(' ');
  console.log(`stats: ${statsLine}`);

  for (const finding of report.warnings) {
    console.log(`WARN  ${formatFinding(finding)}`);
  }
  for (const finding of report.errors) {
    console.log(`ERROR ${formatFinding(finding)}`);
  }
  console.log(`${report.errors.length} error(s), ${report.warnings.length} warning(s)`);

  process.exitCode = report.errors.length > 0 ? 1 : 0;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
