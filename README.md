# 🏛️ Vestiarion AI — Continuous Treasury & Autonomous Business Operator

> **Built natively for Arc L1 (Circle's stablecoin-native Layer-1) with USYC yield primitives, Circle Gateway multichain reserve views, Circle Paymaster gasless execution, non-bypassable on-chain guardrails in `PolicyWallet.sol`, and continuous Euthyna Beancount auditability.**

---

## ⚡ Quick Start

### 1. Install & Build
```bash
npm install
npm run build:contracts
```

### 2. Run Smart Contract Test Suite (21/21 Foundry Tests)
```bash
npm test
# Or with high verbosity:
npm run test:forge
```

### 3. Run Autonomous Agent Integration Tests
```bash
npm run test:agent
```

### 4. Seed Simulated Bills & View Euthyna Audit Report
```bash
npm run seed
npm run report
```

### 5. Start the Backend API Server (for Frontend Integration)
```bash
npm start
# Server listens on http://localhost:4000
```

---

## 🏗️ System Architecture

```text
                               +-------------------------------------+
                               |          Vestiarion Agent           |
                               +-------------------------------------+
                                  |               |                |
             +--------------------+               |                +--------------------+
             |                                    |                                     |
             v                                    v                                     v
+------------------------+             +----------------------+             +------------------------+
| Cash Flow Forecaster   |             | Live OpenSanctions   |             | Euthyna Audit Ledger   |
| (30-Day Buffer & JIT)  |             | (HTTP Screening)     |             | (Beancount + JSON-LD)  |
+------------------------+             +----------------------+             +------------------------+
             |                                    |                                     |
             +--------------------+               |                +--------------------+
                                  |               |                |
                                  v               v                v
                               +-------------------------------------+
                               |         PolicyWallet.sol            |
                               | (On-Chain Guardrails & Escalations) |
                               +-------------------------------------+
                                  |                                |
                 [<= 250 USDC & within cap]               [> 250 USDC or over limit]
                                  |                                |
                                  v                                v
                     +------------------------+       +-------------------------+
                     | Circle Paymaster       |       | On-Chain Escalation     |
                     | Gasless USDC Payout    |       | Queue (Supervisor Alert)|
                     +------------------------+       +-------------------------+
                                                                   |
                                                      [Owner Approval Override]
                                                                   |
                                                                   v
                                                      +-------------------------+
                                                      | Direct USDC Transfer    |
                                                      +-------------------------+
```

---

## 🛡️ Smart Contract Guardrails (`src/PolicyWallet.sol`)

The `PolicyWallet.sol` smart contract enforces mathematical safety on all AI agent payouts:

1. **Daily Spending Limit:** Enforces a maximum automated daily spending ceiling (default: `1,000 USDC / day`).
2. **Single Transaction Ceiling:** Transactions exceeding `250 USDC` cannot be settled directly by the agent and automatically enter the on-chain escalation queue.
3. **Category Daily Limits:** Enforces independent daily limits across `INFRASTRUCTURE`, `PAYROLL`, `SAAS`, and `VENDOR`.
4. **Agent-Proposed, Owner-Approved Escalation:**
   - Agent proposes via `requestEscalatedPayout(vendor, amount, category, invoiceRef, reasoningHash)`.
   - Generates collision-resistant transaction IDs using incremental `escalationNonce`.
   - Supervisor / Owner reviews and calls `approveAndExecuteEscalatedPayout(txId)`.
   - **Category Override Policy:** Supervisor approval explicitly overrides category caps while strictly enforcing the global daily budget.
   - **Timeout Protection:** Pending requests expire automatically after 3 days (`ESCALATION_EXPIRY = 3 days`).
   - **Cancellation:** Stale or rejected requests can be cancelled by agent or owner.
5. **USYC Vault Yield Primitives:**
   - `sweepToUSYC(amount)`: Uses `forceApprove` + `deposit` to sweep surplus USDC into tokenized yield.
   - `redeemUSYC(amount)`: Redeems USYC back to liquid USDC with strict post-balance verification.
6. **Reentrancy Protection & Access Control:** Protected with OpenZeppelin `ReentrancyGuard` and role-based `onlyAgent` and `onlyOwner` modifiers.

---

## 🧪 Verifiable Test Suite Coverage

### 21/21 Foundry Unit Tests (`test/PolicyWalletTest.t.sol`)

| Test Name | Gas | Description | Result |
| :--- | :--- | :--- | :--- |
| `test_Constructor_RevertIfZeroAddress` | 1048221 | Reverts on zero address inputs for usdc, usycVault, or agent | **PASS** |
| `test_ExecuteStandardPayout_Success` | 156349 | Direct automated payout happy path <= 250 USDC | **PASS** |
| `test_ExecutePayout_RevertIfNotWhitelisted` | 49631 | Reverts when paying unapproved vendor | **PASS** |
| `test_ExecutePayout_RevertIfExceedsMaxSingleTx` | 51888 | Reverts if payout exceeds 250 USDC cap | **PASS** |
| `test_ExecutePayout_RevertIfExceedsCategoryLimit` | 254967 | Reverts when category daily budget is exhausted | **PASS** |
| `test_ExecutePayout_RevertIfNotAgent` | 39847 | Unauthorized caller cannot execute payouts | **PASS** |
| `test_RequestEscalatedPayout_RevertIfNotWhitelisted` | 42991 | Escalations must still target whitelisted vendors | **PASS** |
| `test_RequestEscalatedPayout_RevertIfNotAgent` | 40807 | Only agent can submit escalations to queue | **PASS** |
| `test_ApproveEscalation_Success_CategoryOverride` | 370662 | Owner approval successfully executes and overrides category cap | **PASS** |
| `test_ApproveEscalation_RevertIfNotOwner` | 255798 | Non-owner cannot approve escalations | **PASS** |
| `test_ApproveEscalation_RevertIfBreachesGlobalDailyLimit` | 397407 | Reverts if approved escalation exceeds global daily limit | **PASS** |
| `test_ApproveEscalation_RevertIfDoubleExecuted` | 391185 | Replay protection prevents re-execution | **PASS** |
| `test_ApproveEscalation_RevertIfExpired` | 265945 | Reverts execution if 3-day timeout has passed | **PASS** |
| `test_CancelEscalation_Success_ByAgentAndOwner` | 533933 | Agent and Owner can successfully cancel pending requests | **PASS** |
| `test_CancelEscalation_RevertIfUnauthorized` | 262598 | Random callers cannot cancel escalations | **PASS** |
| `test_CancelEscalation_RevertIfAlreadyExecuted` | 391359 | Cannot cancel an executed payout | **PASS** |
| `test_SweepAndRedeemUSYC_Success` | 210461 | USYC deposit approval and redemption balance check | **PASS** |
| `test_SweepAndRedeemUSYC_RevertIfNotAgent` | 61573 | Vault operations restricted to authorized agent | **PASS** |
| `test_SweepUSYC_RevertIfInsufficientBalance` | 46768 | Reverts sweep if balance is lower than amount | **PASS** |
| `test_EscalationNonceUniquenessInSameBlock` | 424589 | Nonce prevents txId collision for identical parameters in same block | **PASS** |
| `test_AdminSetters_Success_And_Reverts` | 224758 | Validates owner setters, parameter updates, and zero-address guards | **PASS** |

---

## 📡 REST API Reference for Frontend Integration

The backend server is mounted at `http://localhost:4000` (`server.js`):

### 1. `GET /api/treasury/summary`
Returns wallet status, remaining daily limit, category limits, USYC balances, and 30-day forecast.
```json
{
  "success": true,
  "data": {
    "policyWallet": {
      "address": "0x9A48F7d6E5B4e91823B58485AcFe7B08E9D02195",
      "dailyLimit": 1000,
      "maxSingleTx": 250,
      "spentToday": 150,
      "dailyLimitRemaining": 850,
      "categoryLimits": { "INFRASTRUCTURE": 500, "PAYROLL": 800, "SAAS": 300, "VENDOR": 400 },
      "categorySpentToday": { "INFRASTRUCTURE": 150, "PAYROLL": 0, "SAAS": 0, "VENDOR": 0 }
    },
    "balances": {
      "arcLiquidUsdc": 9850,
      "arcUsycVault": 25000,
      "totalArcCapital": 34850
    },
    "cashFlowForecasting": {
      "targetBuffer30D": 10900,
      "fixedExpensesSum": 8500,
      "variableAPSum": 2000
    },
    "pendingEscalationsCount": 1
  }
}
```

### 2. `GET /api/treasury/gateway-reserves`
Consolidated multichain reserve balances across Arc L1, Ethereum, Base, and Arbitrum via Circle Gateway.

### 3. `POST /api/invoices/process`
Ingests an invoice and runs it through the agent decision pipeline (Sanctions -> Forecast -> Whitelist -> Payout / Escalation).
**Request Body:**
```json
{
  "vendorAddress": "0x3333333333333333333333333333333333333333",
  "amountUsdc": 120.00,
  "category": "INFRASTRUCTURE",
  "invoiceRef": "INV-8821",
  "reasoning": "Cloud server hosting cluster"
}
```

### 4. `GET /api/escalations`
List of pending escalations awaiting supervisor on-chain approval.

### 5. `POST /api/escalations/:id/approve`
Owner approves and executes the pending transaction on-chain.

### 6. `POST /api/escalations/:id/cancel`
Agent or Owner cancels a pending request.

### 7. `POST /api/treasury/sweep`
Autonomously sweeps surplus USDC into USYC Vault if balance > 30-day operating buffer.

### 8. `POST /api/treasury/redeem`
Redeems USYC back to liquid USDC for JIT liquidity.

### 9. `GET /api/audit/beancount`
Raw plain-text Beancount format double-entry ledger stream.

### 10. `GET /api/audit/receipts`
All JSON-LD cryptographic audit receipts conforming to PRD Section 8 schema.

---

## 📜 Double-Entry Audit Ledger (Euthyna Schema)

```beancount
2026-10-04 * "Circle Paymaster / Vendor Settlement" "Paid INFRASTRUCTURE Invoice #INV-CLOUD-8821"
  meta-agent-id: "0x2222222222222222222222222222222222222222"
  meta-policy-rule-checked: "PolicyWallet.executePayout.passed"
  meta-sanctions-check: "CLEAN"
  meta-tx-hash: "0x3a0031c9f6c04fc1fb773f41c46fd39415c94636a120432037f87b515d8bfef3"
  Assets:Arc:PolicyWallet:USDC                   -120.00 USDC
  Expenses:Infrastructure:Hosting                 120.00 USDC
```
