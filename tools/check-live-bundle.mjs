#!/usr/bin/env node

/**
 * tools/check-live-bundle.mjs
 * Zero-dependency checker that tests whether a flag-on build (VITE_USE_LIVE_DATA=true)
 * contains any legacy mutating endpoint strings or POST method strings.
 * 
 * Target strings:
 * - /treasury/sweep
 * - /treasury/redeem
 * - /invoices/process
 * - /approve
 * - /cancel
 * - /sanctions/check
 * - POST
 */

import { mkdtempSync, rmSync, readdirSync, readFileSync, statSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');

const TARGET_STRINGS = [
  '/treasury/sweep',
  '/treasury/redeem',
  '/invoices/process',
  '/approve',
  '/cancel',
  '/sanctions/check',
  'POST',
];

const tempDir = mkdtempSync(join(tmpdir(), 'secullarius-live-build-'));

function findJsFiles(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      findJsFiles(fullPath, files);
    } else if (stat.isFile() && fullPath.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
}

try {
  console.log(`[CHECK-LIVE-BUNDLE] Running build with VITE_USE_LIVE_DATA=true to: ${tempDir}`);
  const isWindows = process.platform === 'win32';
  const viteCmd = isWindows ? 'npx.cmd' : 'npx';
  const buildResult = spawnSync(viteCmd, ['vite', 'build', '--outDir', tempDir, '--emptyOutDir'], {
    cwd: REPO_ROOT,
    env: {
      ...process.env,
      VITE_USE_LIVE_DATA: 'true',
    },
    encoding: 'utf8',
    shell: isWindows,
  });

  if (buildResult.status !== 0) {
    console.error('[CHECK-LIVE-BUNDLE] Build failed:');
    console.error(buildResult.stderr || buildResult.stdout);
    process.exit(1);
  }

  const jsFiles = findJsFiles(tempDir);
  console.log(`[CHECK-LIVE-BUNDLE] Found ${jsFiles.length} JS bundle file(s) in output.`);

  let totalViolations = 0;
  const counts = Object.fromEntries(TARGET_STRINGS.map((s) => [s, 0]));

  for (const jsFile of jsFiles) {
    const content = readFileSync(jsFile, 'utf8');
    for (const target of TARGET_STRINGS) {
      let count = 0;
      let pos = 0;
      while ((pos = content.indexOf(target, pos)) !== -1) {
        count++;
        pos += target.length;
      }
      counts[target] += count;
      totalViolations += count;
    }
  }

  console.log('[CHECK-LIVE-BUNDLE] String occurrence counts in flag-on JS output:');
  for (const [target, count] of Object.entries(counts)) {
    console.log(`  "${target}": ${count}`);
  }

  if (totalViolations > 0) {
    console.error(`\n[CHECK-LIVE-BUNDLE FAILED] Total occurrences found: ${totalViolations}`);
    process.exit(1);
  } else {
    console.log(`\n[CHECK-LIVE-BUNDLE PASSED] Zero occurrences of legacy mutating strings found in flag-on bundle.`);
    process.exit(0);
  }
} finally {
  try {
    rmSync(tempDir, { recursive: true, force: true });
  } catch (err) {
    console.error(`[WARN] Failed to clean up temp dir ${tempDir}:`, err);
  }
}
