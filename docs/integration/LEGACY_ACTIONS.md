# Legacy Engine Action Audit (Offline Demonstration Fallbacks)

This document records the 6 legacy mutating `POST` call sites in `src/core/useLegacySakellariousEngine.ts`.
All 6 corresponding backend endpoints on `server.js` (`/api/sanctions/check`, `/api/invoices/process`, `/api/escalations/:id/approve`, `/api/escalations/:id/cancel`, `/api/treasury/sweep`, `/api/treasury/redeem`) are completely unauthenticated. `POST /api/sanctions/check` is also missing from the `GET /api` service catalog and consumes external OpenSanctions API quota.
These calls exist strictly for offline interactive demonstrations and are isolated behind the feature flag (`VITE_USE_LIVE_DATA = false`). In live mode (`VITE_USE_LIVE_DATA = true`), all actions are strictly read-only and return `{ ok: false, reason: 'READ_ONLY_LIVE' }`.

---

## 1. OpenSanctions Recipient Screening
- **File & Line:** `src/core/useLegacySakellariousEngine.ts:492-495`
- **Route:** `POST /api/sanctions/check`
- **Payload:** `{ addressOrEntity: string }`
- **Offline Fallback Behaviour:**
  Catches error and falls back to deterministic client-side evaluation:
  If `addressOrEntity.toLowerCase() === '0x8576acc5c05d6ce88f4e49bf65bdf0c62f91353c'`, returns SDN match violation; otherwise returns clean status verdict. Updates `sanctionsVerdict` state.

---

## 2. Process Invoice (4-Stage Pipeline)
- **File & Line:** `src/core/useLegacySakellariousEngine.ts:543-547`
- **Route:** `POST /api/invoices/process`
- **Payload:** `InvoiceSubmissionPayload` (`vendorAddress`, `amountUsdc`, `category`, `invoiceRef`, `reasoning`)
- **Offline Fallback Behaviour:**
  Catches error and runs deterministic simulation:
  - If `amountUsdc > 250.00`: Generates pseudo-random escalation ID (`0x...`), adds new escalation to local `escalations` array halted against cap, increments `escalationNonce`.
  - If `amountUsdc <= 250.00`: Generates pseudo-random transaction hash (`0x...`), prepends paid invoice record with synthetic folio (`EUTHYNA #...`), deducts `amountUsdc` from local `arcLiquidUsdc` and `totalArcCapital`, and updates local `policy.spentToday`.

---

## 3. Escalation Approval & Sovereign Seal
- **File & Line:** `src/core/useLegacySakellariousEngine.ts:662-666`
- **Route:** `POST /api/escalations/:id/approve`
- **Payload:** `{ callerAddress?: string }`
- **Offline Fallback Behaviour:**
  Catches error and runs deterministic resolution:
  Generates pseudo-random hash (`0x...`), removes escalation from local array, prepends paid record `EUTHYNA #00482`, and deducts approved amount from local `arcLiquidUsdc` and `totalArcCapital`.

---

## 4. Escalation Cancellation
- **File & Line:** `src/core/useLegacySakellariousEngine.ts:740-744`
- **Route:** `POST /api/escalations/:id/cancel`
- **Payload:** `{ callerAddress?: string }`
- **Offline Fallback Behaviour:**
  Catches error and removes target transaction from local `escalations` array.

---

## 5. Autonomous Yield Sweep
- **File & Line:** `src/core/useLegacySakellariousEngine.ts:765`
- **Route:** `POST /api/treasury/sweep`
- **Payload:** None (empty body)
- **Offline Fallback Behaviour:**
  Catches error and calculates local surplus:
  `surplus = Math.max(0, balances.arcLiquidUsdc - forecasting.targetBuffer30D)`. If surplus > 0, transfers amount from local `arcLiquidUsdc` to `arcUsycVault` and generates a pseudo-random hash.

---

## 6. Just-In-Time Yield Redemption
- **File & Line:** `src/core/useLegacySakellariousEngine.ts:803-807`
- **Route:** `POST /api/treasury/redeem`
- **Payload:** `{ amount: number }`
- **Offline Fallback Behaviour:**
  Catches error and moves requested `amount` from local `arcUsycVault` to `arcLiquidUsdc` and returns pseudo-random hash.
