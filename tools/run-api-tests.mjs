#!/usr/bin/env node

/**
 * tools/run-api-tests.mjs
 * Zero-dependency test runner for src/api unit tests.
 * 
 * Workflow:
 * 1. Creates an OS temporary directory.
 * 2. Copies all files from src/api into the temp directory.
 * 3. Rewrites local import specifiers (e.g. from './adapters' -> from './adapters.ts')
 *    so Node's native strip-types runner can resolve modules without bundlers.
 * 4. Writes a {"type": "module"} package.json in the temp directory.
 * 5. Runs `node --experimental-strip-types --test` synchronously.
 * 6. Always deletes only its own temp directory in a finally block.
 * 7. Leaves src/api 100% untouched.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync, rmSync, mkdtempSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');
const SRC_API_DIR = resolve(REPO_ROOT, 'src/api');

if (!existsSync(SRC_API_DIR)) {
  console.error(`[ERROR] src/api directory not found at ${SRC_API_DIR}`);
  process.exit(1);
}

const tempPrefix = join(tmpdir(), 'secullarius-api-tests-');
const tempDir = mkdtempSync(tempPrefix);

let exitCode = 0;

try {
  // 1. Copy files and rewrite relative specifiers
  const apiFiles = readdirSync(SRC_API_DIR);
  
  for (const filename of apiFiles) {
    const srcPath = join(SRC_API_DIR, filename);
    const destPath = join(tempDir, filename);

    if (filename.endsWith('.ts')) {
      let content = readFileSync(srcPath, 'utf8');

      // Rewrite relative imports lacking .ts extension:
      // from './types' -> from './types.ts'
      // from './adapters' -> from './adapters.ts'
      // from './client' -> from './client.ts'
      // from './store' -> from './store.ts'
      content = content.replace(
        /(from\s+['"])(\.\/[^'"]+?)(['"])/g,
        (match, prefix, specifier, suffix) => {
          if (specifier.endsWith('.ts') || specifier.endsWith('.js')) {
            return match;
          }
          return `${prefix}${specifier}.ts${suffix}`;
        }
      );

      // Same for export ... from './...'
      content = content.replace(
        /(export\s+[^;]*?from\s+['"])(\.\/[^'"]+?)(['"])/g,
        (match, prefix, specifier, suffix) => {
          if (specifier.endsWith('.ts') || specifier.endsWith('.js')) {
            return match;
          }
          return `${prefix}${specifier}.ts${suffix}`;
        }
      );

      writeFileSync(destPath, content, 'utf8');
    } else {
      writeFileSync(destPath, readFileSync(srcPath));
    }
  }

  // 2. Write package.json with "type": "module"
  writeFileSync(
    join(tempDir, 'package.json'),
    JSON.stringify({ name: 'api-tests-runner', type: 'module' }, null, 2),
    'utf8'
  );

  // 3. Run node native test runner
  console.log(`[RUNNER] Executing API unit tests via node --experimental-strip-types --test in isolated temp dir...`);
  const result = spawnSync(
    process.execPath,
    ['--experimental-strip-types', '--test'],
    {
      cwd: tempDir,
      stdio: 'inherit',
      env: { ...process.env, NODE_NO_WARNINGS: '1' }
    }
  );

  exitCode = result.status ?? (result.signal ? 1 : 0);
} catch (err) {
  console.error('[RUNNER ERROR] Test execution failed:', err);
  exitCode = 1;
} finally {
  // 4. Clean up temp dir
  try {
    rmSync(tempDir, { recursive: true, force: true });
  } catch (cleanErr) {
    console.warn(`[RUNNER WARNING] Failed to remove temp directory ${tempDir}:`, cleanErr.message);
  }
}

process.exit(exitCode);
