# Pull Request: Frontend Architecture Integration & Legacy UI Deprecation

## Summary
Integrates the production React + TypeScript + Three.js continuous treasury dashboard (`src/`) into `integration/backend-wiring`, establishes strict backend-frontend segregation guardrails, and removes legacy prototype UI static assets for backend owner review.

## 1. What This PR Adds
- **Production Frontend (`src/`):** Viewport viewports 01–05, Three.js Optical Governor & Euthyna Data Loom Canvas, Caliper Cursor, telemetry adapters (`src/api/adapters.ts`), and type-safe client store (`src/api/client.ts`).
- **Integration Tooling (`tools/`):** Segregation guard (`frontend-guard.mjs`), isolated API unit test runner (`run-api-tests.mjs` with 14/14 tests passing), standalone mock backend (`mock-api.mjs`), and fixture schemas (`tools/fixtures/`).
- **Comprehensive Documentation (`docs/integration/`):** Full architectural API contracts, audit trail manifests, and security observations.

## 2. What This PR Removes
- **16 Approved UI Files:** The 12 Express-served files under `public/` plus 4 legacy prototype root files (`frontend.html`, `landing.html`, `supernova_app.html`, `supernova_explotion_2.html`).
- **508 Experimental Prototype Assets:** Legacy 3D prototype files under `Public/`.
- **Route Impact:** `GET /`, `GET /frontend`, `GET /codex`, `GET /landing`, and `GET /supernova` in `server.js` now return **HTTP 404** (the Node server does not crash; API endpoints remain 100% unaffected). See [BACKEND_CHANGE_REQUESTS.md](file:///c:/Users/steph/Desktop/Git/Secullarius/docs/integration/BACKEND_CHANGE_REQUESTS.md).

## 3. Shared File Modifications
- **`package.json` & `package-lock.json`:** Additive frontend dependencies only (`react`, `three`, `gsap`, etc.). `dev` and `start` are unchanged (both run `node server.js`); UI scripts are `dev:ui`, `build:ui`, `preview:ui`. Backend dependencies (`express`, `ethers`, `cors`, `dotenv`, `@openzeppelin/contracts`), runtime metadata (`main`, `type`), and scripts (`start`, `dev`, `test`, `seed`, `report`, `deploy:arc`) are **100% identical** to `origin/main`.
- **`index.html`:** Clean single-page Vite React entry root replacing the legacy monolithic HTML.
- **`.gitignore`:** Single additive line (`dist/`) preserving clean build segregation.

## 4. Backend Integrity Proof & Live Mode Zero-POST Invariant
Execution of `git diff origin/main integration/backend-wiring` across all protected backend paths (`server.js`, `services/`, `ledger/`, `scripts/`, `test/`, `lib/`, `src/PolicyWallet.sol`, `foundry.toml`, `.env.example`, `README.md`, `Vestiarion_AI_PRD_v5_0 (1).md`) excluding the 12 approved `public/` deletions is **100% EMPTY**. Zero backend logic was altered. The backend exposes 6 unauthenticated POST routes (including uncataloged `POST /api/sanctions/check`); **live mode contains no POST (the bundle check now proves it) and the flag-on bundle contains no mutating strings.**

### Phase 3 Integration Additions
- **Crash Sites Guarded (Step 0):** Pure formatting helper `src/core/safeFormat.ts` (`safeToFixed`, `safeToLocaleString`, `safeCurrency`, `safeSurplus`, `safeFormatNonce`) with 35 tests ensures missing fields never throw and never render `undefined`, `NaN`, or `Infinity`. Output is byte-identical for numeric values. Root `LiveErrorBoundary.tsx` traps unhandled exceptions in live mode (`"LIVE DATA ERROR // see console"`), rendering children untouched when flag is off.
- **Mock Failure Injections (Step 0b):** `tools/mock-api.mjs` supports `process.env.MOCK_MODE` (`empty | error500 | slow | malformed`) as the default mode when no `?mode=` query parameter is supplied.
- **Read-Only Action Controls (Step 1):** In live mode, components read `{ ok: false, reason }` from engine action returns. Blocked actions in Viewport 04 (`approve`, `cancel`, `reset`) and Viewport 03 (`sweep`, `redeem`, `processInvoice`, `checkSanctions`) show `"READ-ONLY // NO BACKEND ACTION"`, never displaying fake seals, fake success, or `"BUFFER BALANCED"`. Interactive simulations are labeled `[SIMULATION ONLY // NO ON-CHAIN ACTION]` and do not alter live state or dispatch `sakellarious:new-inscription`. Flag off: 100% legacy mock behavior preserved.
- **Authoritative Raw Table (Step 2):** In Viewport 05, `[ RAW TABLE ]` feeds from live receipts (`engine.slabs`) in live mode, displaying `"NO AUDIT RECEIPTS RECORDED // EMPTY RUNWAY"` when empty. Flag off: legacy mock invoices preserved.
- **Data Loom Slabs (Step 3):** `EuthynaDataLoomCanvas` accepts `slabs?: SlabViewModel[]`. Renders up to the 18 newest live slabs when flag is on (zero renders empty-runway state) with scroll offset preserved across appends, removed textures disposed, and offscreen pause preserved. Slab text strictly follows view model provenance: `txKind: 'simulated'` -> `"SIMULATED SETTLEMENT // NO ON-CHAIN TX"`, `'unknown'` -> `"SETTLEMENT UNVERIFIED"`, never `"IMMUTABLE ARC L1 PROOF"` unless `onchain`, IDs marked as derived ordinals, `"DOUBLE-ENTRY ARCHIVE // RECORDED"`, and `"CIRCLE PAYMASTER // SIMULATED SPONSORSHIP"`.
- **Header Strip & Telemetry Markers (Step 4):** Live values displayed for connected endpoints; `[STATIC]` markers placed on unbacked fields (`blockHeight`, `liveHarvestYield`, `7D FORECAST OBLIGATIONS`); loading, stale, and unavailable badges reflect live telemetry status.

### What is Static vs Live
| Field | Status in Live Mode | Provenance |
|---|---|---|
| Liquid Buffer (`arcLiquidUsdc`) | Live (`/api/treasury/summary`) | Live |
| USYC Vault (`arcUsycVault`) | Live (`/api/treasury/summary`) | Live |
| Total Custody (`totalArcCapital`) | Live (`/api/treasury/summary`) | Live |
| Operating Floor (`targetBuffer30D`) | Live (`/api/treasury/summary`) | Live |
| Escalations (`escalations`) | Live (`/api/escalations/pending`) | Live |
| Ledger Slabs / Receipts (`slabs`) | Live (`/api/ledger/receipts`) | Live / Derived |
| Double-entry beancount (`rawBeancount`) | Live (`/api/ledger/beancount`) | Live |
| Block Height (`blockHeight`) | `5042002 [STATIC]` | Static (no backend route) |
| Harvest Yield (`liveHarvestYield`) | `+0.000000 [STATIC]` | Static (no backend route) |
| 7D Obligations (`68,400 USDC`) | `68,400 USDC [STATIC]` | Static (no backend route) |

### Read-Only Actions in Live Mode
All mutating actions in live mode return `{ ok: false, reason: 'READ_ONLY_LIVE' }` and are blocked with UI notices:
- `approveEscalation`, `cancelEscalation`, `resetEscalationDemo`: Viewport 04 Sovereign Seal blocked; displays `"READ-ONLY // NO BACKEND ACTION"`.
- `sweepSurplusYield`, `redeemYield`, `processInvoice`, `checkSanctions`: Viewport 03 tactical controls blocked; displays `"READ-ONLY // NO BACKEND ACTION"`.

## 5. Development & Testing
- **Run Isolated Mock Server:** `node tools/mock-api.mjs` (serves fixtures on `:4010`)
- **Run Mock Server Failure Modes:** `MOCK_MODE=empty|error500|slow|malformed node tools/mock-api.mjs`
- **Run Frontend Dev Server (Flag Off):** `npm run dev:ui` (Vite on `http://localhost:5173`)
- **Run Frontend Dev Server (Flag On):** `VITE_USE_LIVE_DATA=true API_PROXY_TARGET=http://localhost:4010 npm run dev:ui`
- **Run Build:** `npm run build:ui` (`tsc && vite build`)
- **Run Full Verification Suite:**
  ```powershell
  npx tsc --noEmit
  node tools/run-api-tests.mjs
  node tools/check-no-mutation.mjs
  node tools/check-live-bundle.mjs
  npx vite build
  node tools/frontend-guard.mjs
  ```

## 6. Architectural Decisions & Proxy Policy (Decision D8)
- **Baseline Proxy Removal:** The baseline proxied `/api` to `:4000` for everyone, so flag-off dev could show live backend data and its legacy POST buttons reached the real backend if it was running; commit C1 removed that.
- **Current Live Data Access:** To see live backend data: `VITE_USE_LIVE_DATA=true`, with `API_PROXY_TARGET` defaulting safely to the mock on `:4010` (`:4000` only if set explicitly).

## 7. Deployment & Dependency Notes
- **Deployment Configuration:** No deployment manifests (e.g. Render, Railway, Docker, Procfile, Vercel) exist in the repository. The host dashboard setup is unknown, so ask the backend owner whether their host runs a `"build"` script.
- **Dependency Audit:** Running `npm uninstall ... --package-lock-only --dry-run` printed `"up to date"` and was inconclusive, so `framer-motion` and `webgl-fluid` stay for now.

## 8. Review Reference & Rollback
- **Security & Route Observations:** [BACKEND_CHANGE_REQUESTS.md](file:///c:/Users/steph/Desktop/Git/Secullarius/docs/integration/BACKEND_CHANGE_REQUESTS.md)
- **Detailed Deletion Log:** [DELETIONS.md](file:///c:/Users/steph/Desktop/Git/Secullarius/docs/integration/DELETIONS.md)
- **Rollback Option:** Revert PR or restore pre-cleanup tag via `git restore --source=pre-cleanup --staged --worktree -- public Public`.
