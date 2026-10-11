# Frontend-to-Backend Gap Report & Reconciliation Matrix

**Reference Baseline:** Frontend (`src/`) vs Backend `origin/main` (`5bf7968`)  
**Status:** Architectural evaluation. Zero assumptions; unavailable data remains strictly unavailable pending user decision.

---

## 1. Scale & Semantic Mismatch Matrix

| UI Component & Element | UI Mock Value / Display | Backend Model & Value | Availability Status | Semantic & Scale Analysis |
| :--- | :--- | :--- | :--- | :--- |
| **Cockpit: Liquid Buffer** | `9,700.00 USDC` or `420,000.00 USDC` | `balances.arcLiquidUsdc` (Active: `2.00 USDC`) | **Backend provides it** | Direct 1:1 mapping from `GET /api/treasury/summary`. Value in testnet backend is currently `2.00 USDC`. |
| **Cockpit: Buffer Floor** | `[FLOOR >= 400K]` | `cashFlowForecasting.targetBuffer30D` (Active: `0.00`) | **Provides something similar with different meaning** | UI mock hardcodes a monumental 400,000 USDC operational floor. In backend, `targetBuffer30D` is dynamically computed by `CashFlowForecaster` from fixed expenses + AP and is currently `0.00`. |
| **Cockpit: Reserve** | `25,000.00 USYC` or `1,000,000.00 USYC` | `balances.arcUsycVault` (Active: `0.00 USYC`) | **Backend provides it** | Direct 1:1 mapping from `GET /api/treasury/summary`. Live balance on testnet is `0.00 USYC`. |
| **Cockpit: Micro-Yield** | `+12.851038` drifting sub-second | None | **Nothing** | Backend does not stream sub-second continuous yield ticks or APY micro-harvesting. Fully synthetic client-side ticker. |
| **Cockpit: Escalation Count** | `1 HALTED [400.00 USDC]` or `[500.00 USDC]` | `pendingEscalationsCount` & `GET /api/escalations` | **Backend provides it** | Direct mapping from `GET /api/escalations`. Active testnet queue currently has `0` pending escalations unless seeded. |
| **Cockpit: State Text** | `STATE // HALTED AT DATUM` vs `STATE // CALIBRATED` | Inferred from `pendingEscalationsCount > 0` | **Backend provides it** | Logic is fully consistent: presence of pending escalations toggles the halted tension state. |
| **Cockpit: Block Height** | `BLK #4,892,111` | None | **Nothing** | Backend does not expose Arc L1 block height in any GET endpoint (`/api/treasury/summary` omits current block number). |
| **Cockpit: Ledger Folio** | `EUTHYNA #00481 [ARC L1]` | None | **Nothing** | Backend has no concept of sequential "Folio" identifiers (`#00481`). Slabs in backend are keyed only by `txHash` and `invoiceRef`. |
| **Hero: Custody Plinth** | `$1,420,000 USDC + USYC` | `balances.totalArcCapital` (Active: `2.00`) | **Backend provides it** | Scale mismatch: UI mock assumes enterprise scale ($1.42M), whereas testnet backend balance is `2.00 USDC`. |
| **Hero: Tolerance Plinth**| `400K FLOOR // 250 SINGLE-TX CAP`| `targetBuffer30D` & `policyWallet.maxSingleTx` (Active: `250.00`) | **Backend provides it** | Single-tx cap (250 USDC) matches backend exactly. Floor is dynamic in backend rather than fixed 400K. |
| **Hero: Proof Plinth** | `EUTHYNA #00481 // ARC L1 VERIFIED` | None | **Nothing** | Folio `#00481` does not exist in backend. |
| **Hero: Datum Axis** | `AXIS Y:00 // DATUM` & `FLOOR 400,000 USDC` | None | **Nothing** | Architectural UI framing label. |
| **Loom: Slab Amounts** | Slabs showing `$85,000.00`, `$110,000.00`, etc. | Backend single-tx cap is strictly `250.00 USDC` (Daily limit: `1000.00 USDC`) | **Provides something similar with different meaning** | **Massive Scale Mismatch:** The UI mock renders massive slabs up to $110,000 USDC. Under backend rules, any payout over 250 USDC triggers an escalation deadlock, and daily volume cannot exceed 1000 USDC. Yield sweeps can be larger in theory, but testnet data only contains 85-350 USDC. |
| **Loom: 18 Distinct Slabs**| 18 immutable register cards | `GET /api/audit/receipts` | **Provides something similar with different meaning** | Backend `ledger/receipts.json` contains committed historical transactions, but they are fewer in volume and lack sequential folio numbers. |
| **Loom: Velocity Coupling**| `VELOCITY COUPLING: 0.95 M/S` | None | **Nothing** | Pure WebGL/GSAP client-side animation telemetry. |
| **Escalation: Dossier Nonce**| `NONCE #1` | `policyWallet.escalationNonce` | **Backend provides it** | Direct mapping from `policyWallet.escalationNonce` and `escalation.escalationNonce`. |
| **Escalation: Timelock** | `TIMELOCK: 72H` | Smart contract 3-day timelock | **Backend provides it** | Contract constant in `PolicyWallet.sol:21` (`3 days`). |

---

## 2. Mutating Routes Segregation Policy

The following 5 routes mutate state, dirty version-controlled `ledger/` files, or broadcast on-chain transactions:
- `POST /api/invoices/process`
- `POST /api/escalations/:id/approve`
- `POST /api/escalations/:id/cancel`
- `POST /api/treasury/sweep`
- `POST /api/treasury/redeem`

**Policy Declaration:**
> **All 5 mutating POST routes are classified as MUTATING, NOT USABLE BY THE FRONTEND.**
> In Phase 2, the frontend API client will be strictly **read-only (GET-only)**. No buttons or form submissions in the UI will send live network calls to these mutating endpoints against any real backend running from this workspace.

---

## 3. Fixtures Strategy (Derived, Not Recorded)

To enable 100% realistic UI development without running a backend process inside this workspace, static fixtures will be derived directly from the committed files in `../backend-origin-main-ref` and served via a standalone mock server:

| Fixture Name | Target Route | Derivation Source | Status Label |
| :--- | :--- | :--- | :--- |
| `summary.json` | `GET /api/treasury/summary` | Synthesized from `PolicyWallet.sol` parameters (`dailyLimit: 1000`, `maxSingleTx: 250`) and committed balances in `ledger/receipts.json`. | **Derived, not recorded** |
| `gateway-reserves.json`| `GET /api/treasury/gateway-reserves` | Extracted from `services/circleStack.js:40-75` multichain model. | **Derived, not recorded** |
| `invoices.json` | `GET /api/invoices` | Formed by transforming the last 5 transactions from `ledger/receipts.json`. | **Derived, not recorded** |
| `escalations.json` | `GET /api/escalations` | Extracted from the escalation structure generated by `seedInitialState` / `services/agentRunner.js:246-267`. | **Derived, not recorded** |
| `beancount.txt` | `GET /api/audit/beancount` | Direct 1:1 copy of committed `ledger/euthyna.beancount` from `origin/main`. | **Derived, not recorded** |
| `receipts.json` | `GET /api/audit/receipts` | Direct 1:1 copy of committed `ledger/receipts.json` from `origin/main`. | **Derived, not recorded** |
| `catalog.json` | `GET /api` | Exact copy of catalog endpoint object in `server.js:80-99`. | **Derived, not recorded** |

---

## 4. Binding Decisions for Phase 2 (Record Only — Not Implemented Yet)

1. **GET-Only Client Law:**
   The frontend API service/client is strictly **GET-only**. It will contain zero methods or functions capable of invoking the 5 mutating backend endpoints (`/process`, `/approve`, `/cancel`, `/sweep`, `/redeem`).
2. **Zero-Dependency Mock Server on Port 4010:**
   A standalone Node script `tools/mock-api.mjs` (using native `node:http`, zero external packages) will serve the derived fixtures on port `4010`. The Vite development proxy configuration (`vite.config.mts`) will read its target from an environment variable (`VITE_API_URL` or `BACKEND_URL`) and default strictly to `http://localhost:4010`, **never** to port `4000`.
3. **Absolute Local Backend Isolation:**
   No frontend code, script, or test will ever start, invoke, or connect to a live backend server running from this repository's working tree. All local development and visual tests will communicate strictly with `tools/mock-api.mjs`.
