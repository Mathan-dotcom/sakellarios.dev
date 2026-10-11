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
  - **Direct Invoice Payouts (`circleStack.js:91`):** `txHash` is generated via `Math.random()` producing a pseudo-random 64-hex string. Purely simulated; zero on-chain transaction is broadcast.
  - **Yield Sweeps (`agentRunner.js:444`):** `txHash` is generated via `Math.random()`. Purely simulated.
  - **Yield Redemptions (`agentRunner.js:475`):** `txHash` is generated via `Math.random()`. Purely simulated.
  - **Escalation Requests (`agentRunner.js:231`):** Generates an on-chain transaction hash (`receipt.hash`) only if `agentSigner` and `policyContract` are initialized; otherwise omitted. Not written to `receipts.json` or `euthyna.beancount`.
  - **Escalation Approvals (`agentRunner.js:386`):** If `ownerSigner` and `policyContract` are initialized, broadcasts on-chain transaction and records real `receipt.hash`. If keys are absent, falls back to simulated pseudo-random hash.
- **Decision:** Every ledger view model carries a classification field:
  $$\text{txKind}: \text{'onchain'} \mid \text{'simulated'} \mid \text{'unknown'}$$
  with `txHash` preserved as plain raw data.
- **Phase 3 UI Rule:** The UI must **never** present a simulated or unknown entry as verified on-chain proof or provide an active block explorer link to a fake transaction hash. This rule is recorded here for implementation during Phase 3 view binding.

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
