# Integration Engineering Standing Rules

These absolute rules govern all agent actions across the integration process.

## 1. Process & Runtime Management
- **Never start, stop, or kill a process:** Background dev servers (e.g. Vite on `:5173`) and terminal sessions belong exclusively to the operator.
- **Never run `npm run dev` or `npm start`:** Both scripts execute `node server.js` (backend runtime). The UI dev server is `npm run dev:ui`, and only the operator starts it.
- **Never interactively prompt:** All verification and commands execute autonomously without blocking.

## 2. Git & Source Control Segregation
- **Never push:** Remote pushes (`git push`) are strictly forbidden. All work remains local.
- **Backend & Protected Paths are Read-Only:** Zero edits, additions, deletions, renames, or formatting changes inside paths listed in `PROTECTED_PATHS.txt` (including `server.js`, `services/`, `ledger/`, `scripts/`, `test/`, `lib/`, `foundry.toml`, `.env.example`, `public/`, and documentation).
- **Run Guard Script Before Every Commit:** Always execute `node tools/frontend-guard.mjs` and `node tools/check-no-mutation.mjs`. Never use `--no-verify`.
- **Pre-Integration Baseline:** Tag `pre-integration-baseline` serves as the immutable reference ref for all segregation audits.

## 3. Dependency & Environment Boundary
- **Zero New Dependencies:** Never run `npm install`, `npm update`, or `npm audit fix`. No package additions or version modifications in `package.json` or `package-lock.json`.
- **No `.env*` Files:** Never create `.env`, `.env.local`, or any environment configuration files.
- **Single Existing File Modification:** `vite.config.mts` is the only pre-existing project file permitted to be edited. All other integration code resides in new files under `src/api/`, `tools/`, and `docs/integration/`.

## 4. Architectural Data Integrity
- **GET-Only Access:** The frontend integration layer is strictly read-only. No mutating HTTP requests (`POST`, `PUT`, `DELETE`, `PATCH`) are permitted to be executed by components or client wrappers.
- **Safe Proxy Targets:** Proxy target defaults to `http://localhost:4010` (mock server) via `API_PROXY_TARGET`. Never default to `http://localhost:4000` (live backend).
- **Truth in Telemetry:** Zero multipliers, synthetic scale factors, or artificial inflation. Elements without backend support remain static with explicit provenance tagging.
- **STOP on Anything Unexpected:** If an unanticipated conflict, error, or ambiguity occurs, halt execution immediately and report.
