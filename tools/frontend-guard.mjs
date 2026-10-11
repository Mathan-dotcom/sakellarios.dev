#!/usr/bin/env node

/**
 * frontend-guard.mjs
 * Guard script to protect backend files from inadvertent modifications by frontend tasks.
 * Uses `git diff -z` to safely handle spaces, parentheses, and special characters.
 */

import { execFileSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');

// 1. Load protected paths list
const protectedListPath = resolve(REPO_ROOT, 'docs/integration/PROTECTED_PATHS.txt');
if (!existsSync(protectedListPath)) {
  console.error(`[GUARD ERROR] Protected paths definition not found at: ${protectedListPath}`);
  process.exit(1);
}

const protectedLines = readFileSync(protectedListPath, 'utf8')
  .split(/\r?\n/)
  .map(line => line.trim())
  .filter(line => line.length > 0 && !line.startsWith('#'));

const protectedExact = new Set();
const protectedPrefixes = [];
const protectedWildcards = [];

for (const rawEntry of protectedLines) {
  const normalized = rawEntry.replace(/\\/g, '/');
  if (normalized.includes('*')) {
    const regexPattern = '^' + normalized
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*') + '$';
    protectedWildcards.push(new RegExp(regexPattern));
  } else if (normalized.endsWith('/')) {
    protectedPrefixes.push(normalized);
  } else if (normalized === 'src/PolicyWallet.sol' || normalized.includes('.')) {
    protectedExact.add(normalized);
  } else {
    protectedPrefixes.push(normalized + '/');
    protectedExact.add(normalized);
  }
}

function isProtected(filePath) {
  const norm = filePath.replace(/\\/g, '/');
  if (protectedExact.has(norm)) return true;
  for (const prefix of protectedPrefixes) {
    if (norm.startsWith(prefix) || norm === prefix.slice(0, -1)) return true;
  }
  for (const regex of protectedWildcards) {
    if (regex.test(norm) || regex.test(norm.split('/').pop())) return true;
  }
  return false;
}

// 2. Check Merge Status vs Baseline Tag
const isMerging = existsSync(resolve(REPO_ROOT, '.git/MERGE_HEAD'));

let diffArgs = [];
if (isMerging) {
  // During merge resolution: protected paths in index MUST be identical to origin/main
  console.log('[GUARD] Merge in progress (.git/MERGE_HEAD detected).');
  console.log('[GUARD] Verifying that protected paths in the index are identical to origin/main...');
  diffArgs = ['diff', '--cached', '-z', '--name-only', 'origin/main'];
} else {
  let targetRef = process.env.BASELINE_TAG || process.argv[2] || 'pre-integration-baseline';
  const refExists = (ref) => {
    try {
      execFileSync('git', ['rev-parse', '--verify', '--quiet', ref], { cwd: REPO_ROOT, stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  };

  if (refExists(targetRef)) {
    console.log(`[GUARD] Verifying working tree against baseline ref: ${targetRef}`);
    diffArgs = ['diff', '-z', '--name-only', targetRef];
  } else if (refExists('refs/tags/' + targetRef)) {
    console.log(`[GUARD] Verifying working tree against baseline tag: refs/tags/${targetRef}`);
    diffArgs = ['diff', '-z', '--name-only', 'refs/tags/' + targetRef];
  } else {
    console.warn(`[GUARD WARNING] Baseline tag "${targetRef}" not found yet (will be created post-merge).`);
    console.log(`[GUARD] Checking staged changes against HEAD...`);
    diffArgs = ['diff', '--cached', '-z', '--name-only'];
  }
}

let stdoutBuf;
try {
  stdoutBuf = execFileSync('git', diffArgs, { cwd: REPO_ROOT });
} catch (err) {
  console.error('[GUARD ERROR] Failed to execute git diff:', err.message);
  process.exit(1);
}

// Parse NUL-delimited output
const changedFiles = stdoutBuf
  .toString('utf8')
  .split('\0')
  .map(f => f.trim())
  .filter(Boolean);

const violations = [];
for (const file of changedFiles) {
  if (isProtected(file)) {
    violations.push(file);
  }
}

if (violations.length > 0) {
  console.error('\n======================================================');
  console.error('❌ [FRONTEND GUARD FAILURE] PROTECTED BACKEND FILES DIFFER');
  console.error('======================================================');
  console.error('The following protected backend files differ from the required reference:');
  for (const v of violations) {
    console.error(`  - ${v}`);
  }
  if (isMerging) {
    console.error('\nProtected backend files must be resolved IDENTICALLY to origin/main.');
    console.error('Use: git checkout origin/main -- <file> to restore backend authority.');
  } else {
    console.error('\nBackend files are strictly READ-ONLY. Revert these modifications.');
  }
  console.error('======================================================\n');
  process.exit(1);
}

console.log(`[GUARD PASSED] All ${changedFiles.length} evaluated change(s) comply with protection rules.`);
process.exit(0);
