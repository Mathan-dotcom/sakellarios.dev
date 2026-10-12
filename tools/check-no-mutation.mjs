#!/usr/bin/env node

/**
 * tools/check-no-mutation.mjs
 * Mechanical verification that frontend code under src/api, the live bridge,
 * and any hooks contains zero mutating requests or mutating endpoint strings.
 * Zero external dependencies.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const FORBIDDEN_HTTP_METHODS = [
  /['"`]POST['"`]/,
  /['"`]PUT['"`]/,
  /['"`]PATCH['"`]/,
  /['"`]DELETE['"`]/,
  /method\s*:\s*['"`](POST|PUT|PATCH|DELETE)['"`]/i,
];

const FORBIDDEN_ROUTE_STRINGS = [
  '/treasury/sweep',
  '/treasury/redeem',
  '/invoices/process',
  '/approve',
  '/cancel',
];

function collectFiles(dir, predicate, out = []) {
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath, predicate, out);
    } else if (entry.isFile() && predicate(fullPath)) {
      out.push(fullPath);
    }
  }
  return out;
}

// Find all target files:
// 1. All files under src/api (excluding .test.ts)
// 2. The live bridge files (e.g. src/core/useLiveSakellariousEngine.ts, src/core/liveAdapters.ts)
// 3. Any file in src matching *hooks*
const targetFiles = new Set();

const srcApiDir = path.join(REPO_ROOT, 'src', 'api');
collectFiles(srcApiDir, (p) => !p.endsWith('.test.ts') && !p.endsWith('.test.js'), Array.from(targetFiles))
  .forEach(f => targetFiles.add(f));

const liveBridgeFiles = [
  path.join(REPO_ROOT, 'src', 'core', 'useLiveSakellariousEngine.ts'),
  path.join(REPO_ROOT, 'src', 'core', 'liveAdapters.ts'),
];

// If useLegacySakellariousEngine.ts exists, useSakellariousEngine.ts is the wrapper and must also be checked
if (fs.existsSync(path.join(REPO_ROOT, 'src', 'core', 'useLegacySakellariousEngine.ts'))) {
  liveBridgeFiles.push(path.join(REPO_ROOT, 'src', 'core', 'useSakellariousEngine.ts'));
}

for (const f of liveBridgeFiles) {
  if (fs.existsSync(f)) {
    targetFiles.add(f);
  }
}

const srcDir = path.join(REPO_ROOT, 'src');
collectFiles(srcDir, (p) => p.includes('hooks') && !p.endsWith('.test.ts') && !p.endsWith('.test.js'))
  .forEach(f => targetFiles.add(f));

let violationsCount = 0;
const clientPathNormalized = path.normalize(path.join(REPO_ROOT, 'src', 'api', 'client.ts'));

for (const filePath of targetFiles) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relPath = path.relative(REPO_ROOT, filePath).replace(/\\/g, '/');
  const lines = content.split(/\r?\n/);

  lines.forEach((line, lineIdx) => {
    const lineNum = lineIdx + 1;

    // Check fetch( outside src/api/client.ts
    if (path.normalize(filePath) !== clientPathNormalized && line.includes('fetch(')) {
      console.error(`[VIOLATION] ${relPath}:${lineNum} - Forbidden 'fetch(' outside src/api/client.ts`);
      violationsCount++;
    }

    // Check forbidden HTTP method strings
    for (const regex of FORBIDDEN_HTTP_METHODS) {
      if (regex.test(line)) {
        console.error(`[VIOLATION] ${relPath}:${lineNum} - Forbidden mutating HTTP method string`);
        violationsCount++;
        break;
      }
    }

    // Check forbidden mutating route strings
    for (const route of FORBIDDEN_ROUTE_STRINGS) {
      if (line.includes(route)) {
        console.error(`[VIOLATION] ${relPath}:${lineNum} - Forbidden mutating endpoint string: "${route}"`);
        violationsCount++;
      }
    }
  });
}

if (violationsCount > 0) {
  console.error(`\n[CHECK FAILED] Found ${violationsCount} mutation violation(s) across target frontend files.`);
  process.exit(1);
} else {
  console.log(`[CHECK PASSED] Verified ${targetFiles.size} target file(s) - Zero mutating requests, methods, or routes.`);
  process.exit(0);
}
