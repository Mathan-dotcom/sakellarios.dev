# Backend REST API Contract Specification (Read-Only Routes)

**Reference Target:** `origin/main` (commit `5bf7968`) via detached worktree `../backend-origin-main-ref`  
**Governing Server:** `server.js` & `services/agentRunner.js`  
**API Baseline Base URL:** `http://localhost:4000/api`

---

## 1. Global Response & Error Shapes

All JSON endpoints on the backend return one of two standardized payload envelopes:

### Standard Success Envelope
```json
{
  "success": true,
  "data": { ... } // or array
}
```

### Standard Error Envelope
HTTP Status: `400 Bad Request`, `404 Not Found`, or `500 Internal Server Error`
```json
{
  "success": false,
  "error": "Descriptive error message string"
}
```
*(Exception: `GET /api` returns root discovery metadata directly without envelope. `GET /api/audit/beancount` returns raw `text/plain` on success and string on error).*

---

## 2. Exhaustive Specification for the 7 GET Routes

### Route 1: `GET /api` (Service Catalog Index)
- **Content-Type:** `application/json`
- **Purpose:** Service discovery and route catalog.
- **Contract Schema:**
  | Key | Type | Unit / Format | Description |
  | :--- | :--- | :--- | :--- |
  | `service` | `string` | Text | Service name identifier |
  | `status` | `string` | Enum (`"ONLINE"`) | Operational health |
  | `network` | `string` | Text | Active blockchain network |
  | `policyWallet` | `string` | Hex Address (`0x...`) | Checksummed/normalized wallet address |
  | `endpoints` | `object` | Key-Value | Dictionary of supported routes |
  | `frontendAppUrl`| `string` | URL | Default hosted web URL |
- **Sample Payload:**
  ```json
  {
    "service": "sakellarious.dev - Autonomous Treasury API",
    "status": "ONLINE",
    "network": "Arc Testnet (Chain ID 5042002)",
    "policyWallet": "0xB9087E75D7DDE6138BF5673Ad36f4AcDb1806aD0",
    "endpoints": {
      "treasurySummary": "GET /api/treasury/summary",
      "gatewayReserves": "GET /api/treasury/gateway-reserves",
      "processInvoice": "POST /api/invoices/process",
      "pendingEscalations": "GET /api/escalations",
      "approveEscalation": "POST /api/escalations/:id/approve",
      "cancelEscalation": "POST /api/escalations/:id/cancel",
      "sweepYield": "POST /api/treasury/sweep",
      "redeemYield": "POST /api/treasury/redeem",
      "beancountLedger": "GET /api/audit/beancount",
      "jsonLdReceipts": "GET /api/audit/receipts"
    },
    "frontendAppUrl": "http://localhost:4000/"
  }
  ```

---

### Route 2: `GET /api/treasury/summary` (Treasury Health & Telemetry)
- **Content-Type:** `application/json`
- **Purpose:** Primary aggregation route feeding CockpitHeader, Viewport01 Hero, and Viewport03.
- **Contract Schema:**
  | Key Path | Type | Unit / Format | Description |
  | :--- | :--- | :--- | :--- |
  | `success` | `boolean` | `true` | Request status flag |
  | `data.policyWallet.address` | `string` | Hex Address (`0x...`) | Smart contract policy wallet address |
  | `data.policyWallet.agentAddress` | `string` | Hex Address (`0x...`) | Autonomous agent operator address |
  | `data.policyWallet.ownerAddress` | `string` | Hex Address (`0x...`) | Multisig / owner supervisor address |
  | `data.policyWallet.dailyLimit` | `number` | Float (USDC, 2 decimals) | Global 24h spending ceiling |
  | `data.policyWallet.maxSingleTx` | `number` | Float (USDC, 2 decimals) | Autonomous single-tx execution cap |
  | `data.policyWallet.spentToday` | `number` | Float (USDC, 2 decimals) | Total USDC disbursed today |
  | `data.policyWallet.dailyLimitRemaining` | `number` | Float (USDC, 2 decimals) | `dailyLimit - spentToday` |
  | `data.policyWallet.categoryLimits` | `object` | Key-Float map (USDC) | Category daily allowances |
  | `data.policyWallet.categorySpentToday` | `object` | Key-Float map (USDC) | Category spent amounts |
  | `data.policyWallet.escalationNonce` | `number` | Integer | On-chain sequential escalation counter |
  | `data.balances.arcLiquidUsdc` | `number` | Float (USDC, 2-6 decimals) | On-chain liquid USDC balance in wallet |
  | `data.balances.arcUsycVault` | `number` | Float (USYC, 2-6 decimals) | USYC vault balance |
  | `data.balances.totalArcCapital` | `number` | Float (USDC equiv) | `arcLiquidUsdc + arcUsycVault` |
  | `data.balances.multichainReserves` | `object` | Nested Reserve Map | Circle Gateway reserves |
  | `data.cashFlowForecasting.targetBuffer30D` | `number` | Float (USDC) | Computed 30D liquidity floor |
  | `data.cashFlowForecasting.fixedExpensesSum` | `number` | Float (USDC) | Sum of fixed recurring obligations |
  | `data.cashFlowForecasting.variableAPSum` | `number` | Float (USDC) | Projected variable accounts payable |
  | `data.cashFlowForecasting.yieldSweepStatus` | `object` | Boolean + string | Evaluation whether to sweep surplus |
  | `data.pendingEscalationsCount` | `number` | Integer | Active halted escalations count |
- **Sample Payload:**
  ```json
  {
    "success": true,
    "data": {
      "policyWallet": {
        "address": "0xB9087E75D7DDE6138BF5673Ad36f4AcDb1806aD0",
        "agentAddress": "0x97aB6e781F034a8Cd0b60b1c6EA5a072529e8665",
        "ownerAddress": "0xa9c97E3D0f95be9Fc990B3686997eC346D96833e",
        "dailyLimit": 1000.00,
        "maxSingleTx": 250.00,
        "spentToday": 0.00,
        "dailyLimitRemaining": 1000.00,
        "categoryLimits": {
          "INFRASTRUCTURE": 500.00,
          "PAYROLL": 800.00,
          "SAAS": 300.00,
          "VENDOR": 400.00
        },
        "categorySpentToday": {
          "INFRASTRUCTURE": 0.00,
          "PAYROLL": 0.00,
          "SAAS": 0.00,
          "VENDOR": 0.00
        },
        "escalationNonce": 0
      },
      "balances": {
        "arcLiquidUsdc": 2.00,
        "arcUsycVault": 0.00,
        "totalArcCapital": 2.00,
        "multichainReserves": { ... }
      },
      "cashFlowForecasting": {
        "targetBuffer30D": 0.00,
        "fixedExpensesSum": 0.00,
        "variableAPSum": 0.00,
        "yieldSweepStatus": {
          "shouldSweep": false,
          "reason": "Liquid balance (2) below target buffer (0)"
        }
      },
      "pendingEscalationsCount": 0
    }
  }
  ```

---

### Route 3: `GET /api/treasury/gateway-reserves` (Multichain Reserves)
- **Content-Type:** `application/json`
- **Purpose:** Telemetry for Circle Gateway multichain treasury allocations.
- **Contract Schema:**
  | Key Path | Type | Unit / Format | Description |
  | :--- | :--- | :--- | :--- |
  | `success` | `boolean` | `true` | Request status flag |
  | `data.gatewayStatus` | `string` | Enum (`"LIVE_CONNECTED"`) | Gateway connection state |
  | `data.lastSyncedAt` | `string` | ISO-8601 UTC string | Timestamp of synchronization |
  | `data.corporateAddress` | `string` | Hex Address (`0x...`) | Query target corporate address |
  | `data.chains` | `array` | Objects | Breakdown of chain balances |
  | `data.chains[].chainName` | `string` | Text | Human readable network label |
  | `data.chains[].chainId` | `number` | Integer | EIP-155 Chain ID |
  | `data.chains[].usdcBalance` | `number` | Float (USDC, 2 decimals) | Human float amount |
  | `data.chains[].usycBalance` | `number` | Float (USYC, 2 decimals) | Human float amount |
  | `data.chains[].isNativeSettlement` | `boolean` | Boolean | True if Arc L1 native settlement |
- **Sample Payload:**
  ```json
  {
    "success": true,
    "data": {
      "gatewayStatus": "LIVE_CONNECTED",
      "lastSyncedAt": "2026-10-11T16:40:21.830Z",
      "corporateAddress": "0xB9087E75D7DDE6138BF5673Ad36f4AcDb1806aD0",
      "chains": [
        {
          "chainName": "Arc L1 (Settlement Layer)",
          "chainId": 5042002,
          "usdcBalance": 2.00,
          "usycBalance": 0.00,
          "isNativeSettlement": true
        },
        {
          "chainName": "Base",
          "chainId": 8453,
          "usdcBalance": 18200.50,
          "usycBalance": 0.00,
          "isNativeSettlement": false
        },
        {
          "chainName": "Ethereum Mainnet",
          "chainId": 1,
          "usdcBalance": 45000.00,
          "usycBalance": 0.00,
          "isNativeSettlement": false
        },
        {
          "chainName": "Arbitrum One",
          "chainId": 42161,
          "usdcBalance": 12300.25,
          "usycBalance": 0.00,
          "isNativeSettlement": false
        }
      ]
    }
  }
  ```

---

### Route 4: `GET /api/invoices` (Processed & Pending Invoices)
- **Content-Type:** `application/json`
- **Purpose:** In-memory queue of processed settlement records and active escalations.
- **Contract Schema:**
  | Key Path | Type | Unit / Format | Description |
  | :--- | :--- | :--- | :--- |
  | `success` | `boolean` | `true` | Status flag |
  | `data.processed` | `array` | Objects | Invoices settled during current process session |
  | `data.processed[].invoiceRef` | `string` | Text | Unique billing identifier |
  | `data.processed[].vendor` | `string` | Hex Address (`0x...`) | Payee address |
  | `data.processed[].amount` | `number` | Float (USDC) | Payment volume |
  | `data.processed[].category` | `string` | Uppercase String | Expenditure category |
  | `data.processed[].status` | `string` | Enum (`"PAID"`) | Settlement outcome |
  | `data.processed[].paymasterSponsored` | `boolean` | `true` | Gasless transaction flag |
  | `data.processed[].txHash` | `string` | Hex bytes32 (`0x...`) | Arc L1 transaction hash |
  | `data.processed[].settledAt` | `string` | ISO-8601 UTC string | Settlement timestamp |
  | `data.pendingEscalation` | `array` | Objects | Active unresolved escalations |
- **Sample Payload:**
  ```json
  {
    "success": true,
    "data": {
      "processed": [
        {
          "invoiceRef": "INV-CLOUD-8821",
          "vendor": "0x3333333333333333333333333333333333333333",
          "amount": 120.00,
          "category": "INFRASTRUCTURE",
          "status": "PAID",
          "paymasterSponsored": true,
          "txHash": "0xb08127020a7f6ff2184a7e91d5568194aef91cbe7821034cbb2339d10e821034",
          "settledAt": "2026-10-11T12:00:00.000Z"
        }
      ],
      "pendingEscalation": []
    }
  }
  ```

---

### Route 5: `GET /api/escalations` (Escalation Queue)
- **Content-Type:** `application/json`
- **Purpose:** Full list of transactions awaiting supervisor review in Viewport 04.
- **Contract Schema:**
  | Key Path | Type | Unit / Format | Description |
  | :--- | :--- | :--- | :--- |
  | `success` | `boolean` | `true` | Status flag |
  | `data` | `array` | Objects | Array of pending transaction records |
  | `data[].txId` | `string` | Hex bytes32 (`0x...`) | Deterministic keccak256 identifier |
  | `data[].vendor` | `string` | Hex Address (`0x...`) | Recipient vendor |
  | `data[].amount` | `number` | Float (USDC, 2 decimals) | Requested payment |
  | `data[].category` | `string` | Uppercase String | Expenditure category |
  | `data[].invoiceRef` | `string` | String | Vendor invoice code |
  | `data[].reasoningHash` | `string` | Hex bytes32 (`0x...`) | Hash of supervisor explanation |
  | `data[].reasoning` | `string` | Text | Human readable justification |
  | `data[].createdAt` | `number` | Unix Timestamp (seconds) | Creation epoch |
  | `data[].agentApproved` | `boolean` | `true` | Initial agent pre-clearance |
  | `data[].ownerApproved` | `boolean` | Boolean | True once approved |
  | `data[].executed` | `boolean` | Boolean | True once funds disbursed |
  | `data[].cancelled` | `boolean` | Boolean | True if aborted |
  | `data[].requiresSupervisorReason` | `string` | Text | Specific boundary breach note |
  | `data[].txHash` | `string` (optional) | Hex bytes32 (`0x...`) | On-chain escalation request tx |
- **Sample Payload:**
  ```json
  {
    "success": true,
    "data": [
      {
        "txId": "0x53d1000b1784f1bb587e9e5eb2d1f4d9c72c08a983b6cb5561a34bfa95f5431f",
        "vendor": "0x6666666666666666666666666666666666666666",
        "amount": 400.00,
        "category": "VENDOR",
        "invoiceRef": "INV-PARTNER-009",
        "reasoningHash": "0x9812bc8834928100234aef91cbe7821034cbb2339d10e821034cba88ef1092a8",
        "reasoning": "External open-source maintainer stipend for Circom ZK-proof optimization.",
        "createdAt": 1728388800,
        "agentApproved": true,
        "ownerApproved": false,
        "executed": false,
        "cancelled": false,
        "requiresSupervisorReason": "Exceeds max single tx threshold (250 USDC)",
        "txHash": "0x88f12a39c099e8d1234a7e91d5568194aef91cbe7821034cbb2339d10e821034"
      }
    ]
  }
  ```

---

### Route 6: `GET /api/audit/beancount` (Raw Double-Entry Ledger)
- **Content-Type:** `text/plain; charset=utf-8`
- **Purpose:** Archival plain-text ledger representing continuous accounting journal.
- **Contract Schema:** **RAW UNSTRUCTURED STRING.**
- **Sample Output:**
  ```text
  ; sakellarious.dev - Euthyna Immutable Audit Ledger
  ; Standard: Beancount v2 Double-Entry Accounting
  ; Operating Chain: Arc L1 (Circle Native)
  ; Settlement Token: USDC

  option "title" "sakellarious.dev Continuous Treasury Ledger"
  option "operating_currency" "USDC"

  2026-01-01 open Assets:Arc:PolicyWallet:USDC USDC
  2026-01-01 open Assets:Arc:USYCVault:USYC USYC
  2026-01-01 open Expenses:Infrastructure:Hosting USDC
  2026-01-01 open Expenses:Payroll:Stipends USDC
  2026-01-01 open Expenses:SaaS:APIs USDC
  2026-01-01 open Expenses:Vendor:Services USDC
  2026-01-01 open Income:Yield:USYC USDC

  2026-10-03 * "Circle Paymaster / Vendor Settlement" "Paid INFRASTRUCTURE Invoice #INV-INFRA-101"
    meta-agent-id: "0x2222222222222222222222222222222222222222"
    meta-policy-rule-checked: "PolicyWallet.executePayout.passed"
    meta-sanctions-check: "CLEAN"
    meta-tx-hash: "0x456ff3554a294c99a650c3d8245491fb70e7db56ea201ccf709f16cd328b29f9"
    meta-timestamp: "2026-10-03T20:40:21.830Z"
    Assets:Arc:PolicyWallet:USDC                   -150.00 USDC
    Expenses:Infrastructure:Hosting            150.00 USDC
  ```

---

### Route 7: `GET /api/audit/receipts` (Cryptographic JSON-LD Receipts)
- **Content-Type:** `application/json`
- **Purpose:** Cryptographic audit receipts array compliant with W3C / Schema.org JSON-LD.
- **Contract Schema:**
  | Key Path | Type | Unit / Format | Description |
  | :--- | :--- | :--- | :--- |
  | `success` | `boolean` | `true` | Status flag |
  | `data` | `array` | Objects | Array of `AgentExecutionReceipt` objects |
  | `data[].@context` | `string` | URL | Schema URI (`https://sakellarious.dev/schemas/audit-v5.jsonld`) |
  | `data[].type` | `string` | `"AgentExecutionReceipt"` | JSON-LD schema entity type |
  | `data[].timestamp` | `string` | ISO-8601 UTC string | Execution timestamp |
  | `data[].agentId` | `string` | Hex Address (`0x...`) | Operator identity |
  | `data[].action` | `string` | Enum (`JIT_VENDOR_PAYMENT`, `YIELD_SWEEP`, `REDEEM_USYC`) | Action classification |
  | `data[].vendorAddress` | `string` (conditional) | Hex Address (`0x...`) | Vendor recipient (for payments) |
  | `data[].amountUsdc` | `number` | Float (USDC) | Volume |
  | `data[].category` | `string` (conditional) | Text | Category label |
  | `data[].invoiceRef` | `string` (conditional) | Text | Billing invoice identifier |
  | `data[].sanctionsVerification` | `object` | Dictionary | Screening provider, status (`"CLEAN"`), and query timestamp |
  | `data[].smartContractVerification` | `object` | Dictionary | On-chain checks: policy contract, dailyLimitRemaining, whitelist, escalationNonce |
  | `data[].usycYieldImpact` | `object` | Dictionary | `redeemedFromUsyc` boolean, `liquidUsdcAvailable` float |
  | `data[].txHash` | `string` | Hex bytes32 (`0x...`) | Settlement transaction hash |
- **Sample Payload:**
  ```json
  {
    "success": true,
    "data": [
      {
        "@context": "https://sakellarious.dev/schemas/audit-v5.jsonld",
        "type": "AgentExecutionReceipt",
        "timestamp": "2026-10-03T20:40:21.830Z",
        "agentId": "0x2222222222222222222222222222222222222222",
        "action": "JIT_VENDOR_PAYMENT",
        "vendorAddress": "0x3333333333333333333333333333333333333333",
        "amountUsdc": 150.00,
        "category": "INFRASTRUCTURE",
        "invoiceRef": "INV-INFRA-101",
        "sanctionsVerification": {
          "provider": "OpenSanctions API (Verified via Pre-flight Engine)",
          "status": "CLEAN",
          "queriedAt": "2026-10-03T20:40:21.408Z"
        },
        "smartContractVerification": {
          "policyContract": "0x9A48F7d6E5B4e91823B58485AcFe7B08E9D02195",
          "dailyLimitRemaining": 850.00,
          "singleTxCheckPassed": true,
          "whitelistVerified": true,
          "reentrancyGuardActive": true,
          "escalationNonce": 0
        },
        "usycYieldImpact": {
          "redeemedFromUsyc": false,
          "liquidUsdcAvailable": 9850.00
        },
        "txHash": "0x456ff3554a294c99a650c3d8245491fb70e7db56ea201ccf709f16cd328b29f9"
      }
    ]
  }
---

### Route 13: `POST /api/sanctions/check` (OpenSanctions Screening Endpoint)
> [!WARNING]
> **Omission in Service Catalog:** This route exists in active backend code at `server.js:210` (`app.post('/api/sanctions/check', ...)`), but is **missing from the `GET /api` service catalog dictionary** (`server.js:80-99`). It is completely unauthenticated and exposes the operator's external OpenSanctions API quota.
> In frontend live mode, `checkSanctions` performs zero network requests and returns `{ ok: false, reason: 'READ_ONLY_LIVE' }`.

- **Content-Type:** `application/json`
- **Method:** `POST`
- **Purpose:** On-demand pre-flight screening of vendor EVM address or entity name against OpenSanctions dataset via `OpenSanctionsVerifier.screenRecipient()`.
- **Request Body:**
  ```json
  {
    "addressOrEntity": "0x8576acc5c05d6ce88f4e49bf65bdf0c62f91353c"
  }
  ```
- **Contract Schema (Success `200 OK`):**
  | Key Path | Type | Unit / Format | Description |
  | :--- | :--- | :--- | :--- |
  | `success` | `boolean` | `true` | Request status flag |
  | `data.status` | `string` | Enum (`"CLEAN"`, `"SANCTIONED"`, `"FLAGGED"`) | Screening verdict |
  | `data.provider` | `string` | Text | Service name (`"OpenSanctions API"`) |
  | `data.queriedAt` | `string` | ISO-8601 UTC string | Timestamp of query |
  | `data.isClean` | `boolean` | Boolean | True if address is clear |
  | `data.matchCount` | `number` (optional) | Integer | Number of fuzzy results if clean |
  | `data.match` | `object` (optional) | Object | Detailed sanction record if matched |
  | `data.diagnostic` | `string` (optional) | Text | Present if evaluated via local fallback |
- **Sample Success Payload:**
  ```json
  {
    "success": true,
    "data": {
      "status": "CLEAN",
      "provider": "OpenSanctions API",
      "queriedAt": "2026-10-12T06:40:21.830Z",
      "matchCount": 0,
      "isClean": true
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: If `addressOrEntity` is omitted or empty (`{ "success": false, "error": "addressOrEntity required" }`).
  - `500 Internal Server Error`: On unexpected service error (`{ "success": false, "error": "<error message>" }`).

---

## 3. Data Loom Slab Fields & Source Derivation Analysis

How every visual field of a Data Loom card slab (`EuthynaDataLoomCanvas.tsx`) maps to backend data:

| Slab UI Field | Visual Mock Example | Availability in `receipts.json` | Availability in `beancount` | How It Would Be Derived |
| :--- | :--- | :--- | :--- | :--- |
| **Folio ID** | `"EUTHYNA #00481"` | **MISSING** | **MISSING** | **NOT PROVIDED BY BACKEND.** In the backend, transactions only have `invoiceRef` and `txHash`. Sequential `"EUTHYNA #XXXXX"` numbers were fabricated by the frontend mock! |
| **Amount** | `$120.00` | Available (`amountUsdc: 150`) | Available (`150.00 USDC`) | Direct read from `receipt.amountUsdc`. |
| **Asset** | `USDC // ARC L1` | Available (`amountUsdc` / action) | Available (`Assets:Arc:... USDC`) | Constant string based on currency unit. |
| **Policy Tag & Status** | `POL-01 [SWEEP]` / `VERIFIED` | Available (`action`, `smartContractVerification`) | Available (`meta-policy-rule-checked`) | Inferred from `receipt.action` and `receipt.smartContractVerification.singleTxCheckPassed`. |
| **UTC Timestamp** | `2024-10-08 11:00:00 UTC` | Available (`timestamp: "2026-10-03T..."`) | Available (`meta-timestamp`) | Direct parse from ISO-8601 string. |
| **Category** | `INFRASTRUCTURE` | Available (`category`) | Available (`Expenses:Infrastructure:...`) | Direct read from `receipt.category`. |
| **Counterparty** | `0x3333333333333333...` | Available (`vendorAddress`) | Inferred from posting accounts | Direct read from `receipt.vendorAddress`. |
| **Transaction Hash** | `0xb08127020a7f...` | Available (`txHash`) | Available (`meta-tx-hash`) | Direct read from `receipt.txHash`. |
| **Paymaster Status**| `CIRCLE PAYMASTER // 0.00`| Inferred (`action: "JIT_VENDOR_PAYMENT"`) | Inferred from header payee | Fixed convention for automated disbursements. |

### Critical Finding: Who assigns the entry number?
- **Finding:** Neither `ledger/receipts.json` nor `ledger/euthyna.beancount` contains sequential folio identifiers like `"EUTHYNA #00481"`.
- If the frontend had to parse `euthyna.beancount` text directly, it would have to run a complex regex state machine over multi-line text, which still would not contain folio IDs.
- **Architectural Conclusion:** The frontend must consume structured JSON from `GET /api/audit/receipts` and derive folio IDs deterministically from array indices (e.g. `EUTHYNA #${String(index + 1).padStart(5, '0')}`), OR the backend must provide a structured `GET /api/audit/slabs` endpoint as documented in [BACKEND_CHANGE_REQUESTS.md](file:///c:/Users/steph/Desktop/Git/Secullarius/docs/integration/BACKEND_CHANGE_REQUESTS.md).
