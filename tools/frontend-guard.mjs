#!/usr/bin/env node

/**
 * frontend-guard.mjs
 * Guard script to protect backend files from inadvertent modifications by frontend tasks.
 * Uses `git diff -z` to safely handle spaces, parentheses, and special characters.
 * Validates protected path boundaries (case-sensitive) and enforces origin/main surface approval.
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

// 2. Load approved deletions list (case-sensitive)
const approvedDeletionsPath = resolve(REPO_ROOT, 'docs/integration/APPROVED_DELETIONS.txt');
const approvedDeletions = new Set();
if (existsSync(approvedDeletionsPath)) {
  for (const line of readFileSync(approvedDeletionsPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      approvedDeletions.add(trimmed.replace(/\\/g, '/'));
    }
  }
}

// 3. Load approved changes list (case-sensitive)
const approvedChangesPath = resolve(REPO_ROOT, 'docs/integration/APPROVED_CHANGES.txt');
const approvedChanges = new Map();
if (existsSync(approvedChangesPath)) {
  for (const line of readFileSync(approvedChangesPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const colonIdx = trimmed.indexOf(':');
      const key = (colonIdx !== -1 ? trimmed.slice(0, colonIdx) : trimmed).trim().replace(/\\/g, '/');
      const reason = colonIdx !== -1 ? trimmed.slice(colonIdx + 1).trim() : '';
      approvedChanges.set(key, reason);
    }
  }
}

export function isProtected(filePath) {
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

export function validateProtectedChanges(changeEntries, customApprovedDeletions = approvedDeletions) {
  const violations = [];
  for (const { status, file } of changeEntries) {
    if (isProtected(file)) {
      if (status.startsWith('D')) {
        if (!customApprovedDeletions.has(file)) {
          violations.push({ file, reason: 'Protected file deleted without entry in APPROVED_DELETIONS.txt' });
        }
      } else {
        violations.push({ file, reason: `Protected file modified or added (status: ${status})` });
      }
    }
  }
  return violations;
}

export function validateOriginMainSurface(changeEntries, customApprovedChanges = approvedChanges) {
  const violations = [];
  let dCount = 0;
  let mCount = 0;
  for (const { status, file } of changeEntries) {
    if (status.startsWith('D') || status.startsWith('M')) {
      if (status.startsWith('D')) dCount++;
      if (status.startsWith('M')) mCount++;
      if (!customApprovedChanges.has(file)) {
        violations.push({ file, status, reason: `Path exists on origin/main and is ${status.startsWith('D') ? 'deleted' : 'modified'} on this branch, but not listed in APPROVED_CHANGES.txt` });
      }
    }
  }
  return { violations, dCount, mCount, totalChanged: dCount + mCount };
}

// Inline dry-run test mode
if (process.argv.includes('--test') || process.argv.includes('--dry-run-test')) {
  console.log('[GUARD TEST] Running inline dry-run verification suite...');

  // Test 1: Unlisted deletion of a protected file
  const test1 = validateProtectedChanges([
    { status: 'D', file: 'server.js' },
    { status: 'D', file: 'public/index.html' }
  ], new Set(['public/index.html']));
  if (test1.length !== 1 || test1[0].file !== 'server.js') {
    console.error('❌ [GUARD TEST FAIL] Test 1 failed: unlisted protected deletion did not trigger violation', test1);
    process.exit(1);
  }
  console.log('  ✓ Test 1: Unlisted protected deletion correctly caught (server.js)');

  // Test 2: Unlisted modification of a protected file
  const test2 = validateProtectedChanges([
    { status: 'M', file: 'server.js' }
  ]);
  if (test2.length !== 1 || test2[0].file !== 'server.js') {
    console.error('❌ [GUARD TEST FAIL] Test 2 failed: unlisted protected modification did not trigger violation', test2);
    process.exit(1);
  }
  console.log('  ✓ Test 2: Unlisted protected modification correctly caught (server.js)');

  // Test 3: Approved deletion of a protected file passes
  const test3 = validateProtectedChanges([
    { status: 'D', file: 'public/index.html' }
  ], new Set(['public/index.html']));
  if (test3.length !== 0) {
    console.error('❌ [GUARD TEST FAIL] Test 3 failed: approved protected deletion triggered violation', test3);
    process.exit(1);
  }
  console.log('  ✓ Test 3: Approved protected deletion passed (public/index.html)');

  // Test 4: Surface check catches unlisted deletion from origin/main
  const mockChangesMap = new Map([['index.html', 'Vite entry']]);
  const test4 = validateOriginMainSurface([
    { status: 'D', file: 'unlisted-legacy.html' },
    { status: 'M', file: 'index.html' }
  ], mockChangesMap);
  if (test4.violations.length !== 1 || test4.violations[0].file !== 'unlisted-legacy.html') {
    console.error('❌ [GUARD TEST FAIL] Test 4 failed: unlisted origin/main deletion not caught', test4.violations);
    process.exit(1);
  }
  console.log('  ✓ Test 4: Unlisted origin/main deletion correctly caught (unlisted-legacy.html)');

  // Test 5: Surface check catches unlisted modification from origin/main
  const test5 = validateOriginMainSurface([
    { status: 'M', file: 'README.md' }
  ], mockChangesMap);
  if (test5.violations.length !== 1 || test5.violations[0].file !== 'README.md') {
    console.error('❌ [GUARD TEST FAIL] Test 5 failed: unlisted origin/main modification not caught', test5.violations);
    process.exit(1);
  }
  console.log('  ✓ Test 5: Unlisted origin/main modification correctly caught (README.md)');

  // Test 6: Case sensitivity: Public/ is not protected, public/ is protected
  if (!isProtected('public/foo.js')) {
    console.error('❌ [GUARD TEST FAIL] Test 6 failed: public/foo.js should be protected');
    process.exit(1);
  }
  if (isProtected('Public/foo.js')) {
    console.error('❌ [GUARD TEST FAIL] Test 6 failed: Public/foo.js should NOT be protected');
    process.exit(1);
  }
  console.log('  ✓ Test 6: Case sensitivity confirmed (public/ is protected, Public/ is not)');

  console.log('[GUARD TEST PASSED] All 6 dry-run verification tests passed successfully.');
  process.exit(0);
}

// 4. Execution of Guard Checks
const isMerging = existsSync(resolve(REPO_ROOT, '.git/MERGE_HEAD'));

let diffArgs = [];
if (isMerging) {
  console.log('[GUARD] Merge in progress (.git/MERGE_HEAD detected).');
  diffArgs = ['diff', '--cached', '--no-renames', '-z', '--name-status', 'origin/main'];
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
    diffArgs = ['diff', '--no-renames', '-z', '--name-status', targetRef];
  } else if (refExists('refs/tags/' + targetRef)) {
    console.log(`[GUARD] Verifying working tree against baseline tag: refs/tags/${targetRef}`);
    diffArgs = ['diff', '--no-renames', '-z', '--name-status', 'refs/tags/' + targetRef];
  } else {
    console.warn(`[GUARD WARNING] Baseline tag "${targetRef}" not found.`);
    console.log(`[GUARD] Checking staged changes against HEAD...`);
    diffArgs = ['diff', '--cached', '--no-renames', '-z', '--name-status'];
  }
}

let stdoutBuf;
try {
  stdoutBuf = execFileSync('git', diffArgs, { cwd: REPO_ROOT });
} catch (err) {
  console.error('[GUARD ERROR] Failed to execute git diff:', err.message);
  process.exit(1);
}

// Parse NUL-delimited status & file pairs
const tokens = stdoutBuf.toString('utf8').split('\0');
const changeEntries = [];
for (let i = 0; i < tokens.length - 1; i += 2) {
  const status = tokens[i].trim();
  const file = tokens[i + 1]?.trim();
  if (status && file) {
    changeEntries.push({ status, file });
  }
}

// 4A. Protected Paths Verification
const protectedViolations = validateProtectedChanges(changeEntries);
if (protectedViolations.length > 0) {
  console.error('\n======================================================');
  console.error('❌ [FRONTEND GUARD FAILURE] PROTECTED BACKEND FILES DIFFER');
  console.error('======================================================');
  for (const v of protectedViolations) {
    console.error(`  - ${v.file}: ${v.reason}`);
  }
  console.error('\nBackend paths are strictly READ-ONLY. Permitted deletions must be in APPROVED_DELETIONS.txt.');
  console.error('======================================================\n');
  process.exit(1);
}

// 4B. Surface Check Against origin/main
let surfaceDiffBuf;
try {
  surfaceDiffBuf = execFileSync('git', ['diff', '--no-renames', '-z', '--name-status', 'origin/main'], { cwd: REPO_ROOT });
} catch (err) {
  console.error('[GUARD ERROR] Failed to execute surface diff against origin/main:', err.message);
  process.exit(1);
}

const surfaceTokens = surfaceDiffBuf.toString('utf8').split('\0');
const surfaceChangeEntries = [];
for (let i = 0; i < surfaceTokens.length - 1; i += 2) {
  const status = surfaceTokens[i].trim();
  const file = surfaceTokens[i + 1]?.trim();
  if (status && file) {
    surfaceChangeEntries.push({ status, file });
  }
}

const surfaceResult = validateOriginMainSurface(surfaceChangeEntries);
console.log(`[GUARD SURFACE CHECK] Total origin/main paths changed: ${surfaceResult.totalChanged} (Deletions: ${surfaceResult.dCount}, Modifications: ${surfaceResult.mCount}).`);

if (surfaceResult.violations.length > 0) {
  console.error('\n======================================================');
  console.error('❌ [FRONTEND GUARD FAILURE] UNAPPROVED ORIGIN/MAIN SURFACE CHANGES');
  console.error('======================================================');
  for (const v of surfaceResult.violations) {
    console.error(`  - [${v.status}] ${v.file}: ${v.reason}`);
  }
  console.error('\nEvery deletion or modification of files from origin/main must be listed in docs/integration/APPROVED_CHANGES.txt.');
  console.error('======================================================\n');
  process.exit(1);
}

console.log(`[GUARD PASSED] All ${changeEntries.length} evaluated baseline change(s) and all ${surfaceResult.totalChanged} origin/main change(s) comply with protection and approval rules.`);
process.exit(0);
