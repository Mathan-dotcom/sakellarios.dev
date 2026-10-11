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

## 4. PowerShell Execution Commands

### Mode A: Mock Server (Default, Zero Backend Impact)
```powershell
# Terminal 1: Launch Mock Server on port 4010
node tools/mock-api.mjs

# Terminal 2: Run Frontend Dev Server (Proxies /api -> :4010)
$env:API_PROXY_TARGET = "http://localhost:4010"
$env:VITE_USE_LIVE_DATA = "false"
npm run dev
```

### Mode B: Live Mock Telemetry (UI Consuming Mock Data Store)
```powershell
$env:API_PROXY_TARGET = "http://localhost:4010"
$env:VITE_USE_LIVE_DATA = "true"
npm run dev
```

### Mode C: Live Backend (Read-Only Proxy to localhost:4000)
```powershell
# Requires backend running on :4000. All non-GET requests rejected at proxy with 405.
$env:API_PROXY_TARGET = "http://localhost:4000"
$env:VITE_USE_LIVE_DATA = "true"
npm run dev
```

## 5. Open Questions for Phase 3
1. Should `txKind: 'unknown'` display a warning icon or neutral badge in the Data Loom card slab?
2. Shall Data Loom cards enforce a maximum rendered slab count (e.g. 50 items) to prevent WebGL memory saturation?
