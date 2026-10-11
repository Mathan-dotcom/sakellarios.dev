#!/usr/bin/env node

/**
 * tools/find-unused-files.mjs
 * Zero-dependency module graph walker and unused-file audit script.
 * 
 * Rules:
 * 1. Entry point: index.html -> src/main.tsx
 * 2. Graph resolution:
 *    - JS/TS: static imports, export ... from, dynamic import(), new URL(..., import.meta.url), require()
 *    - CSS: @import, url(...)
 *    - HTML: <script>, <link>, <img>, etc.
 * 3. Conservative Candidate Rule:
 *    A file is a candidate ONLY if:
 *      (1) It is unreachable from the entry graph, AND
 *      (2) Its filename (basename) AND relative path appear in NO other tracked text file (across the entire repo), AND
 *      (3) It is NOT on the keep list.
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, statSync } from 'fs';
import { resolve, dirname, join, relative, basename, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');

// 1. Get all tracked files via git ls-files
let trackedFilesRaw = '';
try {
  trackedFilesRaw = execSync('git ls-files', { cwd: REPO_ROOT, encoding: 'utf8' });
} catch (e) {
  console.error('[ERROR] Failed to run git ls-files:', e.message);
  process.exit(1);
}

const trackedFiles = trackedFilesRaw
  .split('\n')
  .map(f => f.trim().replace(/\\/g, '/'))
  .filter(Boolean);

const trackedSet = new Set(trackedFiles);

// 2. Define Keep List
// - Every PROTECTED_PATHS entry except public/
// - ledger/, docs/, tools/, config files, lockfiles, DESIGN.md, README, the PRD, .gitignore, reference/, dist/
const protectedListPath = resolve(REPO_ROOT, 'docs/integration/PROTECTED_PATHS.txt');
let protectedLines = [];
if (existsSync(protectedListPath)) {
  protectedLines = readFileSync(protectedListPath, 'utf8')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));
}

function isProtectedExceptPublic(filePath) {
  const norm = filePath.replace(/\\/g, '/');
  if (norm.startsWith('public/') || norm === 'public') {
    return false; // public/ is explicitly exempt from keep list
  }
  for (const raw of protectedLines) {
    const p = raw.replace(/\\/g, '/');
    if (p === 'public/' || p === 'public') continue;
    if (p.includes('*')) {
      const reg = new RegExp('^' + p.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
      if (reg.test(norm) || reg.test(basename(norm))) return true;
    } else if (p.endsWith('/')) {
      if (norm.startsWith(p) || norm === p.slice(0, -1)) return true;
    } else if (norm === p || norm.startsWith(p + '/')) {
      return true;
    }
  }
  return false;
}

function isOnKeepList(filePath) {
  const norm = filePath.replace(/\\/g, '/');
  const base = basename(norm).toLowerCase();

  // 1. Protected paths except public
  if (isProtectedExceptPublic(norm)) return true;

  // 2. Explicit directories on keep list
  if (norm.startsWith('ledger/') || norm === 'ledger') return true;
  if (norm.startsWith('docs/') || norm === 'docs') return true;
  if (norm.startsWith('tools/') || norm === 'tools') return true;
  if (norm.startsWith('reference/') || norm === 'reference') return true;
  if (norm.startsWith('dist/') || norm === 'dist') return true;

  // 3. Config files, lockfiles, meta
  if (norm === 'package.json' || norm === 'package-lock.json') return true;
  if (norm === 'tsconfig.json' || norm === 'tsconfig.node.json') return true;
  if (norm === 'vite.config.mts' || norm === 'vite.config.ts' || norm === 'vite.config.js') return true;
  if (norm === '.gitignore' || norm === '.antigravityignore') return true;
  if (norm === 'foundry.toml') return true;
  if (base === 'design.md') return true;
  if (base === 'readme.md') return true;
  if (base === 'agents.md') return true;
  if (base === 'tasks.md') return true;
  if (norm.includes('prd') || norm.includes('Vestiarion_AI_PRD')) return true;

  return false;
}

// 3. Module Graph Resolution from index.html -> src/main.tsx
const reachable = new Set();
const visited = new Set();

function resolveImport(specifier, fromFile) {
  if (!specifier || typeof specifier !== 'string') return null;
  // Ignore external packages (e.g. 'react', 'gsap', 'three', 'ethers', etc.)
  // and absolute URLs
  if (specifier.startsWith('http://') || specifier.startsWith('https://') || specifier.startsWith('//')) {
    return null;
  }
  if (!specifier.startsWith('.') && !specifier.startsWith('/')) {
    return null; // External package
  }

  let basePath;
  if (specifier.startsWith('/')) {
    basePath = resolve(REPO_ROOT, '.' + specifier);
  } else {
    basePath = resolve(REPO_ROOT, dirname(fromFile), specifier);
  }

  const candidateExtensions = ['', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.css', '.json', '.svg', '.png', '.jpg', '.jpeg'];
  
  // Direct file check or with extensions
  for (const ext of candidateExtensions) {
    const candidate = basePath + ext;
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return relative(REPO_ROOT, candidate).replace(/\\/g, '/');
    }
  }

  // Directory index check (e.g. ./folder -> ./folder/index.ts)
  if (existsSync(basePath) && statSync(basePath).isDirectory()) {
    for (const ext of ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.css']) {
      const candidate = join(basePath, 'index' + ext);
      if (existsSync(candidate) && statSync(candidate).isFile()) {
        return relative(REPO_ROOT, candidate).replace(/\\/g, '/');
      }
    }
  }

  return null;
}

function extractDependencies(filePath) {
  const fullPath = resolve(REPO_ROOT, filePath);
  if (!existsSync(fullPath)) return [];
  const content = readFileSync(fullPath, 'utf8');
  const deps = [];
  const ext = extname(filePath).toLowerCase();

  if (ext === '.html') {
    // <script src="...">
    const scriptRegex = /<script\b[^>]*\bsrc=["']([^"']+)["']/gi;
    let m;
    while ((m = scriptRegex.exec(content)) !== null) deps.push(m[1]);

    // <link href="...">
    const linkRegex = /<link\b[^>]*\bhref=["']([^"']+)["']/gi;
    while ((m = linkRegex.exec(content)) !== null) deps.push(m[1]);

    // <img src="...">
    const imgRegex = /<img\b[^>]*\bsrc=["']([^"']+)["']/gi;
    while ((m = imgRegex.exec(content)) !== null) deps.push(m[1]);
  } else if (ext === '.css') {
    // @import "..." or @import url(...)
    const importRegex = /@import\s+(?:url\(['"]?([^'"\)]+)['"]?\)|['"]([^'"]+)['"])/g;
    let m;
    while ((m = importRegex.exec(content)) !== null) deps.push(m[1] || m[2]);

    // url(...)
    const urlRegex = /url\(['"]?([^'"\)\s]+)['"]?\)/g;
    while ((m = urlRegex.exec(content)) !== null) {
      if (!m[1].startsWith('data:')) deps.push(m[1]);
    }
  } else if (['.ts', '.tsx', '.js', '.jsx', '.mjs'].includes(ext)) {
    // Static imports: import ... from '...' or import '...'
    const staticImportRegex = /(?:import|export)\s+(?:[\w*\s{},]*\s+from\s+)?['"]([^'"]+)['"]/g;
    let m;
    while ((m = staticImportRegex.exec(content)) !== null) deps.push(m[1]);

    // Dynamic import('...')
    const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((m = dynamicImportRegex.exec(content)) !== null) deps.push(m[1]);

    // new URL('...', import.meta.url)
    const newUrlRegex = /new\s+URL\s*\(\s*['"]([^'"]+)['"]\s*,\s*import\.meta\.url\s*\)/g;
    while ((m = newUrlRegex.exec(content)) !== null) deps.push(m[1]);

    // require('...')
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((m = requireRegex.exec(content)) !== null) deps.push(m[1]);
  }

  const resolved = [];
  for (const d of deps) {
    const res = resolveImport(d, filePath);
    if (res) resolved.push(res);
  }
  return resolved;
}

function traverseGraph(entryFile) {
  const normEntry = entryFile.replace(/\\/g, '/');
  if (visited.has(normEntry)) return;
  visited.add(normEntry);
  reachable.add(normEntry);

  const deps = extractDependencies(normEntry);
  for (const dep of deps) {
    reachable.add(dep);
    traverseGraph(dep);
  }
}

// Traverse starting from index.html
if (existsSync(resolve(REPO_ROOT, 'index.html'))) {
  traverseGraph('index.html');
}

// 4. Load all tracked text files for conservative cross-referencing
const textExtensions = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.html', '.css',
  '.md', '.txt', '.toml', '.sol', '.yaml', '.yml', '.beancount', '.svg'
]);

const trackedTextFiles = [];
for (const tf of trackedFiles) {
  const ext = extname(tf).toLowerCase();
  if (textExtensions.has(ext) || tf.endsWith('.jsonld') || tf.endsWith('.sol')) {
    try {
      const full = resolve(REPO_ROOT, tf);
      if (existsSync(full)) {
        trackedTextFiles.push({
          path: tf,
          content: readFileSync(full, 'utf8')
        });
      }
    } catch {
      // binary or unreadable
    }
  }
}

function searchAllTrackedFiles(targetPath) {
  const targetBase = basename(targetPath);
  const targetRel = targetPath;
  const hits = [];

  for (const { path: tfPath, content } of trackedTextFiles) {
    // Don't count self
    if (tfPath === targetPath) continue;
    
    // Check for exact relative path occurrence or exact basename occurrence
    let countRel = 0;
    let countBase = 0;
    
    if (content.includes(targetRel)) countRel++;
    if (content.includes(targetBase)) countBase++;

    if (countRel > 0 || countBase > 0) {
      hits.push({
        file: tfPath,
        hitType: countRel > 0 ? 'rel_path' : 'basename'
      });
    }
  }
  return hits;
}

// 5. Audit all tracked files
const auditResults = [];

for (const tf of trackedFiles) {
  const onKeep = isOnKeepList(tf);
  const isReachable = reachable.has(tf);
  const textHits = searchAllTrackedFiles(tf);
  const isCandidate = !isReachable && textHits.length === 0 && !onKeep;

  auditResults.push({
    path: tf,
    onKeep,
    isReachable,
    textHits,
    isCandidate
  });
}

// Output summary
console.log('====================================================');
console.log('AUDIT REPORT: MODULE GRAPH & CANDIDATE ANALYSIS');
console.log('====================================================');
console.log(`Total tracked files: ${trackedFiles.length}`);
console.log(`Reachable from entry graph (index.html -> src/main.tsx): ${reachable.size}`);
console.log('Reachable files:');
for (const r of Array.from(reachable).sort()) {
  console.log(`  + ${r}`);
}

console.log('\n----------------------------------------------------');
console.log('FRONTEND-OWNED FILES ANALYSIS (src/ & root-level):');
console.log('----------------------------------------------------');

const srcFiles = auditResults.filter(r => r.path.startsWith('src/'));
console.log(`\nFiles under src/ (${srcFiles.length} total):`);
for (const sf of srcFiles) {
  const status = sf.isReachable ? 'REACHABLE' : 'UNREACHABLE';
  const keepStr = sf.onKeep ? ' [KEEP LIST]' : '';
  const hitsStr = sf.textHits.length > 0 ? ` [MENTIONS: ${sf.textHits.map(h => h.file).slice(0, 3).join(', ')}${sf.textHits.length > 3 ? '...' : ''}]` : ' [0 MENTIONS]';
  const candStr = sf.isCandidate ? ' => CANDIDATE FOR DELETION' : '';
  console.log(`  - ${sf.path} : ${status}${keepStr}${hitsStr}${candStr}`);
}

const candidates = auditResults.filter(r => r.isCandidate);
console.log('\n----------------------------------------------------');
console.log(`ALL CONSERVATIVE CANDIDATES (total: ${candidates.length}):`);
console.log('----------------------------------------------------');
for (const c of candidates) {
  console.log(`  * ${c.path}`);
}

console.log('\n====================================================');
