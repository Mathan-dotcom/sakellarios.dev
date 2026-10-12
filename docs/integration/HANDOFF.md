# Frontend-Backend Integration Handoff

## 1. Branch, Baseline & Commit History
- **Active Branch:** `integration/backend-wiring`
- **Baseline Tag:** `pre-integration-baseline` (commit `4994674`)
- **Key Commits:**
  - `4994674`: Merge backend from `origin/main`, restore `public/` and PRD, set baseline.
  - `e0c58be`: Architectural decisions D1-D6 recorded.
  - `9e93fad`: Contract DTOs, provenance view models, runtime type guards.
  - `614ee5d`: GET-only HTTP client and pure data adapters.
  - `9a0b5f2`: Shared polling store with exponential backoff & visibility awareness.
  - `4fe8855`: Mock API server (`tools/mock-api.mjs`) & fixtures on `:4010`.
  - `e19e8ed`: Vite proxy configuration enforcing GET-only bypass to `:4010`.
  - `3b84f8e`: Refined `txKind` rules per runtime config and regenerated fixtures.
  - `6429569`: Dynamic `VITE_API_BASE`, `USE_LIVE_DATA` flag, and unit test coverage.

## 2. Directory Architecture
- `src/api/types.ts`: DTOs from `CONTRACT.md`, runtime type guards, view models (`SourceKind`, `TxKind`).
- `src/api/client.ts`: GET-only HTTP client, exponential backoff, abort/timeout, mixed-content notes.
- `src/api/adapters.ts`: Pure adapters mapping DTOs to view models with edge money and UTC formatting.
- `src/api/store.ts`: Singleton store, single in-flight route requests, tab visibility polling pause.
- `tools/mock-api.mjs`: Zero-dependency Node HTTP mock server on port 4010 (GET only, failure injection).
- `tools/fixtures/`: Canonical JSON fixture files derived from committed ledger and handlers.

## 3. Decisions Summary (D1–D6)
- **D1:** Data Loom Folio IDs derived from array ordinals (`idSource: 'derived-ordinal'`).
- **D2:** Strict telemetry integrity; per-field provenance tags (`live`, `derived`, `static`).
- **D3:** `USE_LIVE_DATA` defaults to `false` via `VITE_USE_LIVE_DATA`. Mock visual engine intact.
- **D4:** `txKind` classification: vendor payouts, sweeps, and redemptions = `simulated`; approvals = `unknown`.
- **D5:** Chain ID dynamically resolved (default `5042002`, never hardcoded `42111`).
- **D6:** Adapters tolerate missing, duplicate, and out-of-order entries without throwing.
- **D7:** Flag-off segregation and non-GET proxy rejection.
- **D8:** Proxy behavior & baseline segregation: The baseline proxied `/api` to `:4000` for everyone, so flag-off dev could show live backend data and its legacy POST buttons reached the real backend if it was running; C1 removed that. To see live data: `VITE_USE_LIVE_DATA=true`, with `API_PROXY_TARGET` defaulting to the mock on `:4010` (`:4000` only if set explicitly).

## 4. PowerShell Execution Commands

### Mode A: Mock Server (Default, Zero Backend Impact)
```powershell
# Terminal 1: Launch Mock Server on port 4010
node tools/mock-api.mjs

# Terminal 2: Run Frontend Dev Server (Proxies /api -> :4010)
$env:API_PROXY_TARGET = "http://localhost:4010"
$env:VITE_USE_LIVE_DATA = "false"
npm run dev:ui
```

### Mode B: Live Mock Telemetry (UI Consuming Mock Data Store)
```powershell
$env:API_PROXY_TARGET = "http://localhost:4010"
$env:VITE_USE_LIVE_DATA = "true"
npm run dev:ui
```

### Mode C: Live Backend (Read-Only Proxy to localhost:4000)
```powershell
# Requires backend running on :4000. All non-GET requests rejected at proxy with 405.
$env:API_PROXY_TARGET = "http://localhost:4000"
$env:VITE_USE_LIVE_DATA = "true"
npm run dev:ui
```

### Running API Unit Tests (Zero-Dependency Isolated Test Runner)
```powershell
# Runs Node native test runner in isolated temp environment; src/api is untouched
node tools/run-api-tests.mjs
```

### Mock Server Failure Injections (MOCK_MODE)
`tools/mock-api.mjs` supports simulated failure modes via the `MOCK_MODE` environment variable (default mode when no `?mode=` query parameter is supplied):
- `empty`: Returns empty/null payloads (`data: null` or empty arrays `[]`).
- `error500`: Responds with HTTP 500 Internal Server Error.
- `slow`: Injects a 3000ms artificial latency delay.
- `malformed`: Returns truncated/malformed JSON strings to test frontend resilience.
The mock server remains strictly GET-only across all modes; any non-GET request receives HTTP 405 Method Not Allowed.

## 5. Deployment & Build Notes
- **Deployment Configuration:** No deployment manifests (e.g. Render, Railway, Docker, Procfile, Vercel) exist in the repository. The host dashboard setup is unknown, so ask the backend owner whether their host environment runs a `"build"` script.
- **Package Lock Audit:** Running `npm uninstall ... --package-lock-only --dry-run` printed `"up to date"` and is inconclusive, so `framer-motion` and `webgl-fluid` stay for now.

## 6. Phase 3 Live Integration Summary (Steps 0–5)

### What Changed
- **Crash Sites Guarded (Step 0):** Pure formatting helper `src/core/safeFormat.ts` (`safeToFixed`, `safeToLocaleString`, `safeCurrency`, `safeSurplus`, `safeFormatNonce`) with 35 tests prevents throws and `undefined`/`NaN`/`Infinity` rendering on missing backend fields. Root error boundary `src/components/LiveErrorBoundary.tsx` traps unhandled render errors in live mode (`"LIVE DATA ERROR // see console"`), rendering children untouched when flag is off.
- **Mock Failure Injections (Step 0b):** `tools/mock-api.mjs` reads `process.env.MOCK_MODE` (`empty | error500 | slow | malformed`) as the default mode when no `?mode=` query parameter is provided.
- **Live Action Guards (Step 1):** In live mode, components read `{ ok: false, reason }` from engine action returns. Blocked actions in Viewport 04 (`approve`, `cancel`, `reset`) and Viewport 03 (`sweep`, `redeem`, `processInvoice`, `checkSanctions`) display `"READ-ONLY // NO BACKEND ACTION"`, never displaying fake seals, fake success, or `"BUFFER BALANCED"`. Tactical simulations are explicitly labeled `[SIMULATION ONLY // NO ON-CHAIN ACTION]` and do not mutate live data or fire `sakellarious:new-inscription`.
- **Raw Table (Step 2):** In Viewport 05, `[ RAW TABLE ]` feeds from authoritative live receipts (`engine.slabs`) in live mode, displaying `"NO AUDIT RECEIPTS RECORDED // EMPTY RUNWAY"` when empty. Flag-off remains on legacy mock invoices.
- **Data Loom Slabs (Step 3):** `EuthynaDataLoomCanvas` accepts `slabs?: SlabViewModel[]`. In live mode, renders up to the 18 newest live slabs (fewer renders fewer, zero renders empty-runway state) with scroll offset preserved across appends, textures properly disposed, and offscreen pause preserved. Text adheres strictly to view model provenance: `txKind: 'simulated'` -> `"SIMULATED SETTLEMENT // NO ON-CHAIN TX"`, `'unknown'` -> `"SETTLEMENT UNVERIFIED"`, `"IMMUTABLE ARC L1 PROOF"` only when `onchain`, IDs marked as derived ordinals, `"DOUBLE-ENTRY ARCHIVE // RECORDED"`, and `"CIRCLE PAYMASTER // SIMULATED SPONSORSHIP"`.
- **Header Strip & Telemetry Markers (Step 4):** Live values displayed for connected endpoints; `[STATIC]` markers placed on unbacked fields (`blockHeight`, `liveHarvestYield`, `7D FORECAST OBLIGATIONS`); loading, stale, and unavailable badges reflect live telemetry status.
- **Live Mode Zero-POST Invariant (Step 5):** Live mode contains no POST (the bundle check now proves it) and the flag-on bundle contains no mutating strings.

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
- `approveEscalation`: Returns `{ ok: false, reason: 'READ_ONLY_LIVE' }`. Blocked notice displayed; no seal applied.
- `cancelEscalation`: Returns `{ ok: false, reason: 'READ_ONLY_LIVE' }`. Blocked notice displayed.
- `resetEscalationDemo`: Blocked with `"READ-ONLY // NO BACKEND ACTION"`.
- `sweepSurplusYield`: Returns `{ ok: false, reason: 'READ_ONLY_LIVE' }`. Blocked notice displayed.
- `redeemYield`: Returns `{ ok: false, reason: 'READ_ONLY_LIVE' }`. Blocked notice displayed.
- `processInvoice`: Returns `{ ok: false, reason: 'READ_ONLY_LIVE' }`. Blocked notice displayed; no inscription emitted.
- `checkSanctions`: Returns `{ ok: false, reason: 'READ_ONLY_LIVE' }`. Blocked notice displayed.

### How to Test
1. **Flag Off (Legacy Baseline):**
   ```powershell
   $env:VITE_USE_LIVE_DATA = "false"
   npm run dev:ui
   ```
2. **Flag On with Mock API:**
   ```powershell
   node tools/mock-api.mjs
   $env:VITE_USE_LIVE_DATA = "true"
   $env:API_PROXY_TARGET = "http://localhost:4010"
   npm run dev:ui
   ```
3. **Flag On Failure Modes:**
   ```powershell
   $env:MOCK_MODE = "empty" # or "error500", "slow", "malformed"
   node tools/mock-api.mjs
   ```
4. **Verification Suite:**
   ```powershell
   npx tsc --noEmit
   node tools/run-api-tests.mjs
   node tools/check-no-mutation.mjs
   node tools/check-live-bundle.mjs
   npx vite build
   node tools/frontend-guard.mjs
   ```
