#!/usr/bin/env node

/**
 * tools/check-no-mutation.mjs
 * Mechanical verification that all frontend code under src/ (excluding legacy engine
 * and test files) contains zero mutating requests, network side channels, or mutating endpoint strings.
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
  '/sanctions/check',
];

const FORBIDDEN_NETWORK_APIS = [
  { token: 'XMLHttpRequest', message: "Forbidden network API: 'XMLHttpRequest'" },
  { token: 'WebSocket', message: "Forbidden network API: 'WebSocket'" },
  { token: 'EventSource', message: "Forbidden network API: 'EventSource'" },
  { token: 'sendBeacon', message: "Forbidden network API: 'sendBeacon'" },
  { token: 'axios', message: "Forbidden network API: 'axios'" },
  { token: 'new Request(', message: "Forbidden network API: 'new Request('" },
];

const clientPathNormalized = path.normalize(path.join(REPO_ROOT, 'src', 'api', 'client.ts'));

export function scanFileContent(filePath, content, clientPath = clientPathNormalized) {
  const violations = [];
  const lines = content.split(/\r?\n/);
  const isClient = path.normalize(filePath) === clientPath;
  const relPath = path.relative(REPO_ROOT, filePath).replace(/\\/g, '/');

  lines.forEach((line, lineIdx) => {
    const lineNum = lineIdx + 1;

    // Check fetch( outside src/api/client.ts
    if (!isClient && line.includes('fetch(')) {
      violations.push({ line: lineNum, message: `Forbidden 'fetch(' outside src/api/client.ts` });
    }

    // Check forbidden network APIs
    for (const api of FORBIDDEN_NETWORK_APIS) {
      if (line.includes(api.token)) {
        violations.push({ line: lineNum, message: api.message });
      }
    }

    // Check forbidden HTTP method strings
    for (const regex of FORBIDDEN_HTTP_METHODS) {
      if (regex.test(line)) {
        violations.push({ line: lineNum, message: `Forbidden mutating HTTP method string` });
        break;
      }
    }

    // Check forbidden mutating route strings
    for (const route of FORBIDDEN_ROUTE_STRINGS) {
      if (line.includes(route)) {
        violations.push({ line: lineNum, message: `Forbidden mutating endpoint string: "${route}"` });
      }
    }
  });

  return { relPath, violations };
}

// ---------------------------------------------------------------------------
// INLINE SELF-TEST
// ---------------------------------------------------------------------------
if (process.argv.includes('--self-test')) {
  console.log('[SELF-TEST] Executing mutation checker verification suite...');
  const testCases = [
    {
      name: "Planted fetch in src/components/Planted.tsx",
      file: path.join(REPO_ROOT, 'src', 'components', 'Planted.tsx'),
      content: "export const Planted = () => { fetch('/api/foo'); return null; };",
      expectedPattern: /fetch\(/,
    },
    {
      name: "Planted XMLHttpRequest in src/components/PlantedXhr.tsx",
      file: path.join(REPO_ROOT, 'src', 'components', 'PlantedXhr.tsx'),
      content: "const xhr = new XMLHttpRequest();",
      expectedPattern: /XMLHttpRequest/,
    },
    {
      name: "Planted WebSocket",
      file: path.join(REPO_ROOT, 'src', 'core', 'planted_ws.ts'),
      content: "const ws = new WebSocket('ws://localhost:4000');",
      expectedPattern: /WebSocket/,
    },
    {
      name: "Planted EventSource",
      file: path.join(REPO_ROOT, 'src', 'core', 'planted_eventsource.ts'),
      content: "const es = new EventSource('/events');",
      expectedPattern: /EventSource/,
    },
    {
      name: "Planted sendBeacon",
      file: path.join(REPO_ROOT, 'src', 'core', 'planted_beacon.ts'),
      content: "navigator.sendBeacon('/log', data);",
      expectedPattern: /sendBeacon/,
    },
    {
      name: "Planted axios",
      file: path.join(REPO_ROOT, 'src', 'core', 'planted_axios.ts'),
      content: "import axios from 'axios';",
      expectedPattern: /axios/,
    },
    {
      name: "Planted new Request(",
      file: path.join(REPO_ROOT, 'src', 'core', 'planted_request.ts'),
      content: "const req = new Request('/api/test');",
      expectedPattern: /new Request\(/,
    },
    {
      name: "Planted method: 'POST' string",
      file: path.join(REPO_ROOT, 'src', 'api', 'planted_post.ts'),
      content: "const req = { method: 'POST' };",
      expectedPattern: /HTTP method/,
    },
    {
      name: "Planted '/treasury/sweep' endpoint string",
      file: path.join(REPO_ROOT, 'src', 'api', 'planted_sweep.ts'),
      content: "const endpoint = '/treasury/sweep';",
      expectedPattern: /\/treasury\/sweep/,
    },
    {
      name: "Planted '/approve' endpoint string",
      file: path.join(REPO_ROOT, 'src', 'core', 'planted_approve.ts'),
      content: "const route = '/approve';",
      expectedPattern: /\/approve/,
    },
    {
      name: "Planted '/sanctions/check' endpoint string",
      file: path.join(REPO_ROOT, 'src', 'core', 'planted_sanctions.ts'),
      content: "const url = '/sanctions/check';",
      expectedPattern: /\/sanctions\/check/,
    },
  ];

  let passed = 0;
  for (const tc of testCases) {
    const { violations } = scanFileContent(tc.file, tc.content);
    const matched = violations.some(v => tc.expectedPattern.test(v.message));
    if (matched) {
      console.log(`[PASS] ${tc.name}: Caught ${violations.length} violation(s): ${violations.map(v => v.message).join('; ')}`);
      passed++;
    } else {
      console.error(`[FAIL] ${tc.name}: Did not catch expected violation! Got:`, violations);
    }
  }

  if (passed === testCases.length) {
    console.log(`\n[SELF-TEST COMPLETE] All ${passed}/${testCases.length} violation patterns caught successfully.`);
    process.exit(0);
  } else {
    console.error(`\n[SELF-TEST FAILED] Passed ${passed}/${testCases.length}`);
    process.exit(1);
  }
}

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

// Target files: Every .ts/.tsx file under src/
// Except:
// - src/core/useLegacySakellariousEngine.ts
// - *.test.ts and *.test.tsx files
const legacyPathNormalized = path.normalize(path.join(REPO_ROOT, 'src', 'core', 'useLegacySakellariousEngine.ts'));
const srcDir = path.join(REPO_ROOT, 'src');

const targetFiles = collectFiles(srcDir, (p) => {
  const isTsOrTsx = p.endsWith('.ts') || p.endsWith('.tsx');
  if (!isTsOrTsx) return false;
  if (path.normalize(p) === legacyPathNormalized) return false;
  if (p.endsWith('.test.ts') || p.endsWith('.test.tsx')) return false;
  return true;
});

let violationsCount = 0;

for (const filePath of targetFiles) {
  const content = fs.readFileSync(filePath, 'utf8');
  const { relPath, violations } = scanFileContent(filePath, content);
  for (const v of violations) {
    console.error(`[VIOLATION] ${relPath}:${v.line} - ${v.message}`);
    violationsCount++;
  }
}

if (violationsCount > 0) {
  console.error(`\n[CHECK FAILED] Found ${violationsCount} total violation(s) across target files.`);
  process.exit(1);
} else {
  console.log(`[CHECK PASSED] Verified ${targetFiles.length} target file(s) across src/ - Zero mutating requests, network APIs, or routes.`);
  process.exit(0);
}
