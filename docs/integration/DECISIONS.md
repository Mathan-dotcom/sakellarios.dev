# Integration Architecture Decisions (Phase 2 & Phase 3)

Document Status: Active Decisions Baseline  
Branch: `integration/backend-wiring`  
Reference Baseline Tag: `pre-integration-baseline`  

---

## Decision D1: Data Loom Slab Identifier Derivation
- **Problem Statement:** The frontend 3D Spatial Data Loom requires an identifier (e.g. `"EUTHYNA #00481"`) for each render slab card. However, neither `ledger/receipts.json` nor `ledger/euthyna.beancount` possesses a sequential folio ID or canonical primary key (transactions only carry `invoiceRef` and `txHash`).
- **Code Audit Fact:** `services/euthynaAudit.js` (`lines 129, 167, 200`) strictly pushes new receipts to the end of the array (`this.receipts.push(receipt)`) and synchronously appends to `ledger/euthyna.beancount` (`fs.appendFileSync`). The ledger entries are append-only with stable order.
- **Decision:** The Slab ID is derived deterministically from the 0-indexed ordinal position in the array returned by `GET /api/audit/receipts`:
  $$\text{folioId} = \text{"EUTHYNA \#"} + \text{String}(index + 1).\text{padStart}(5, \text{'0'})$$
- **Code Tagging:** All derived IDs carry metadata `idSource: 'derived-ordinal'`.
- **Change Request:** Backend change request (d) filed in `docs/integration/BACKEND_CHANGE_REQUESTS.md` requesting canonical sequential IDs or a dedicated `GET /api/audit/slabs` endpoint.

---

## Decision D2: Truth in Telemetry & Field Source Provenance
- **Problem Statement:** Visual mocks contained arbitrary aesthetic scale factors (e.g., inflating balances, multiplying transaction counts, fabrication of non-existent reserve numbers) to populate UI widgets.
- **Decision:** Absolutely **no** scaling, multipliers, or rounding hacks to make live values look larger or more dramatic.
- **Code Tagging:** Every field in UI ViewModels carries explicit provenance metadata:
  - `'live'`: Directly parsed from an authoritative backend API field.
  - `'derived'`: Computed deterministically from live fields without synthetic inflation (e.g. sum of category expenses, percentage of daily limit remaining).
  - `'static'`: Display labels, units, or interface ornaments that have no corresponding backend field.
- Elements without a backend counterpart remain static. No UI visual alterations occur until Phase 3 design review.

---

## Decision D3: Conservative Live Data Toggle
- **Problem Statement:** Direct live wiring must not disrupt visual demonstrations or regress when the backend server is offline.
- **Decision:** A global feature flag `USE_LIVE_DATA` defaults to `false`.
- **Architecture:** The existing visual mock data engine and generator remains 100% intact behind the same unified adapter interface. When `USE_LIVE_DATA = false`, the UI consumes deterministic mock data. When `USE_LIVE_DATA = true`, the UI consumes the reactive polling store.

---

## Decision D4: Transaction Provenance & UI Presentation Restraint
- **Audit Findings (Part A Item 3):**
  - **Direct Invoice Payouts (`circleStack.js:94` in `sponsorAndExecutePayout`):** `paymasterTxHash` is generated via `Math.random()` producing a pseudo-random 64-hex string. Unconditionally simulated; zero on-chain transaction is broadcast.
  - **Yield Sweeps (`agentRunner.js:498` in `sweepSurplusYield`):** `txHash` is generated via `Math.random()`. Unconditionally simulated.
  - **Yield Redemptions (`agentRunner.js:527` in `redeemUsyc`):** `txHash` is generated via `Math.random()`. Unconditionally simulated.
  - **Escalation Requests (`agentRunner.js:231`):** Generates an on-chain transaction hash (`receipt.hash`) only if `agentSigner` and `policyContract` are initialized; otherwise omitted. Not written to `receipts.json` or `euthyna.beancount`.
  - **Escalation Approvals (`agentRunner.js:420` in `approveEscalatedPayout`):** Broadcasts on-chain transaction and records real `receipt.hash` only if `this.policyContract && this.ownerSigner` are configured at runtime. If keys are missing, falls back to simulated pseudo-random hash from `circleStack.js:94`.
- **Classification Rule:**
  - `JIT_VENDOR_PAYMENT`, `YIELD_SWEEP`, and `REDEEM_USYC` (or `YIELD_REDEMPTION`): **`'simulated'`** (unconditionally random in code).
  - `ESCALATION_APPROVAL` and any other action: **`'unknown'`** (simulated vs. real depends on runtime configuration, and the receipt payload contains no field recording whether on-chain execution occurred).
  - Missing or empty hash: **`'unknown'`**.
  - **`'onchain'`** is reserved exclusively for entries where receipt records explicitly prove on-chain execution.
- **Phase 3 UI Presentation Rule:**
  - `'onchain'`: Displays `"IMMUTABLE ARC L1 PROOF"` with transaction hash.
  - `'simulated'`: Displays `"SIMULATED SETTLEMENT // NO ON-CHAIN TX"` and must **not** display the hash as verified proof.
  - `'unknown'`: Displays `"SETTLEMENT UNVERIFIED"`.
  - The UI must never link simulated or unknown hashes to block explorers.

---

## Decision D5: Network & Chain ID Dynamic Resolution
- **Audit Finding:** `.env.example:5` incorrectly documented `ARC_CHAIN_ID=42111`. The authoritative runtime code in `services/agentRunner.js:34`, `services/circleStack.js:15`, `server.js:84`, and `scripts/setupRealtimeArc.js:20` strictly defines `5042002` (Arc Testnet).
- **Decision:** The frontend will **never** hardcode the Chain ID or network string. Network identity is resolved dynamically from `GET /api` (`data.network`) or `GET /api/treasury/gateway-reserves` (`chains[].chainId`). The default fallback is `5042002`.

---

## Decision D6: Adapter Fault Tolerance
- **Decision:** All pure data adapters must be resilient and fault-tolerant:
  - Tolerate missing optional fields, empty lists, and unexpected extra keys.
  - Handle duplicate entries gracefully via deduplication.
  - Handle out-of-order records by sorting deterministically.
  - Never throw unhandled exceptions during data mapping; fallback gracefully to typed defaults.

---

## Decision D7: Flag-Off Segregation & Non-GET Proxy Rejection
- **Context:** The legacy mock engine retains 6 client-side demonstration `POST` dispatchers for offline simulations.
- **Decision:** Flag-off builds must never be served same-origin with the real backend.
- **Proxy Invariant:** When `VITE_USE_LIVE_DATA` is active, the Vite development proxy forwards strictly GET requests and rejects all non-GET requests (`POST`, `PUT`, `DELETE`, `PATCH`) with HTTP 405 Method Not Allowed. When `VITE_USE_LIVE_DATA` is false, the proxy is disabled entirely so flag-off runs in zero-backend isolation.
- **Live Bridge Invariant:** The live data bridge is strictly read-only and contains zero mutating network calls.

---

## Decision D8: Proxy Behavior & Baseline Segregation
- **Context:** The pre-integration baseline unconditionally proxied `/api` to `:4000` for everyone, so flag-off dev could show live backend data and its legacy POST buttons reached the real backend if it was running; commit C1 removed that unsafe default.
- **Decision:** Do not apply any proxy change to unconditionally re-expose `:4000`. To see live backend data, set `VITE_USE_LIVE_DATA=true`, with `API_PROXY_TARGET` defaulting safely to the mock on `:4010` (`:4000` only if explicitly set).


