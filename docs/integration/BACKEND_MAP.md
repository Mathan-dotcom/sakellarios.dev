# Backend Architecture Map (Read-Only Target: `origin/main`)

**Branch Target:** `origin/main` (`5bf7968`)  
**Reference Source:** Detached worktree `../backend-origin-main-ref`  
**Protocol Version:** Vestiarion AI / Sakellarious Autonomous Treasury v1.0.0

---

## 1. System Overview

The backend is an Express-based autonomous treasury and Accounts Payable (AP) / Accounts Receivable (AR) governor built for the Arc L1 blockchain network. It manages continuous corporate liquidity, interacts with on-chain policy contracts, coordinates gasless payouts via Circle Paymaster, screens vendors using OpenSanctions, sweeps surplus liquidity into Ondo USYC yield vaults, and records double-entry audit records in Beancount and JSON-LD formats.

```
                              +---------------------------------------+
                              |         Express HTTP Server           |
                              |             (server.js)               |
                              +-------------------+-------------------+
                                                  |
                                                  v
                              +---------------------------------------+
                              |            VestiarionAgent            |
                              |       (services/agentRunner.js)       |
                              +---+----------+----------+---------+---+
                                  |          |          |         |
         +------------------------+          |          |         +-----------------------+
         |                                   |          |                                 |
         v                                   v          v                                 v
+------------------+     +-------------------+   +--------------------+     +-------------------+
|  CircleStack     |     |  OpenSanctions    |   |  CashFlowForecast  |     |  EuthynaAudit     |
|  (Circle Pay-    |     |  Verifier         |   |  (Target Buffer,   |     |  Ledger           |
|  master, Arc L1) |     |  (sanctions.js)   |   |   Forecaster.js)   |     |  (euthynaAudit.js)|
+--------+---------+     +---------+---------+   +----------+---------+     +---------+---------+
         |                         |                        |                         |
         v                         v                        v                         v
   Arc Testnet RPC            OpenSanctions            In-Memory AP/AR          ledger/
   (PolicyWallet.sol,         REST API                 Cashflow Math            euthyna.beancount
    USDC, USYC)                                                                 receipts.json
```

---

## 2. Core Service Components & File Responsibilities

| File Path | Component Class / Module | Core Responsibility | State / IO Side Effects |
| :--- | :--- | :--- | :--- |
| `server.js` | Express Server (`app`) | Exposes HTTP REST API (port 4000), enables wildcard CORS, routes requests to `VestiarionAgent`, serves static HTML from `public/`. | Network I/O (port 4000) |
| `services/agentRunner.js` | `VestiarionAgent` | Central orchestrator: syncs on-chain state, executes policy checks, routes payouts, requests/approves escalations, sweeps yield. | Dispatches on-chain transactions via signers |
| `services/circleStack.js` | `CircleStackService` | Connects to Arc L1 RPC, wraps USDC ERC20 contract, coordinates Circle Paymaster for gasless transactions. | RPC calls; simulates/sponsors transfers |
| `services/sanctions.js` | `OpenSanctionsVerifier` | Queries OpenSanctions API to screen recipient vendor addresses prior to payment. Also exposed via unauthenticated route `POST /api/sanctions/check`. | Outbound HTTPS requests to OpenSanctions API (unauthenticated external API quota exposure) |
| `services/forecaster.js` | `CashFlowForecaster` | Calculates 30-day operating buffer (fixed expenses + variable AP) and determines if yield sweeping is warranted. | Pure mathematical computation (in-memory) |
| `services/euthynaAudit.js` | `EuthynaAuditLedger` | Records double-entry Beancount journal entries and cryptographic JSON-LD audit receipts. | **Synchronously writes to `ledger/euthyna.beancount` and `ledger/receipts.json`** |
| `services/supervisorNotifier.js` | `SupervisorNotifier` | Dispatches Webhook notifications to human supervisor upon escalation events. | Outbound HTTP POST to `SUPERVISOR_WEBHOOK_URL` |
| `src/PolicyWallet.sol` | Solidity Smart Contract | On-chain guardrail: enforces `dailyLimit`, `maxSingleTx`, whitelisted vendors, category caps, and timelocked escalations. | Arc L1 smart contract |
| `scripts/deploy.js` | Node deployment script | Deploys `PolicyWallet.sol` to Arc L1 using `DEPLOYER_PRIVATE_KEY`. | On-chain deployment |
| `scripts/setupRealtimeArc.js` | Arc setup script | Configures realtime events, addresses, and test accounts on Arc L1. | On-chain configuration |
| `scripts/seedInvoices.js` | Batch ingestion script | Seeds 3 test bills through `agent.processIncomingInvoice()`. | **Writes to `ledger/` files & creates escalations** |

---

## 3. Data Flow & Transaction Lifecycle

0. **Standalone Sanctions Screening:** Client sends unauthenticated `POST /api/sanctions/check`. Directly invokes `OpenSanctionsVerifier.screenRecipient()` querying `api.opensanctions.org` in realtime without caching, consuming external API quota.
1. **Invoice Ingestion:** Client sends `POST /api/invoices/process`.
2. **Pre-flight Screening:** `OpenSanctionsVerifier` screens vendor. If flagged, transaction blocks immediately (`SANCTIONS_BLOCKED`).
3. **Whitelist Verification:** Checks `PolicyWallet.whitelistedVendors(vendor)`.
4. **Policy Boundary Evaluation:**
   - If `amount <= maxSingleTx` (250 USDC) AND `spentToday + amount <= dailyLimit` (1000 USDC) AND category cap not breached:
     - **Execution Path:** `CircleStackService.sponsorAndExecutePayout()` executes gasless transfer via Paymaster.
     - **Audit Path:** `EuthynaAuditLedger.recordPayoutExecution()` appends to `ledger/euthyna.beancount` and writes to `ledger/receipts.json`.
   - If any limit is breached:
     - **Escalation Path:** Submits on-chain `PolicyWallet.requestEscalatedPayout()` transaction using `agentSigner`.
     - In-memory escalation created in `agent.pendingTransactions`.
     - Webhook alert dispatched via `SupervisorNotifier`.
5. **Supervisor Approval:** Client calls `POST /api/escalations/:id/approve`.
   - Executes payout via Paymaster.
   - If owner signer present, broadcasts `approveAndExecuteEscalatedPayout()` on-chain.
   - Appends settlement entry to `ledger/euthyna.beancount` and updates `ledger/receipts.json`.
6. **Yield Sweeping:** Client calls `POST /api/treasury/sweep`.
   - `forecaster.evaluateYieldSweep()` evaluates surplus above 30-day operating buffer.
   - If surplus exists, sweeps liquid USDC into Ondo USYC vault.
   - Appends sweep entry to `ledger/euthyna.beancount` and `ledger/receipts.json`.

---

## 4. External Dependencies & Networks

- **Blockchain Network:** Arc Testnet (Real Chain ID in code: `5042002`; note: `.env.example:5` has stale template value `42111`).
- **Code Citations on `origin/main`:**
  - `services/agentRunner.js:34` (in `VestiarionAgent.prototype.constructor`): `this.chainId = parseInt(process.env.ARC_CHAIN_ID || "5042002");`
  - `services/circleStack.js:15` (in `CircleStackService.prototype.constructor`): `this.chainId = parseInt(process.env.ARC_CHAIN_ID || "5042002");`
  - `server.js:84` (in route handler `app.get(['/api', '/api/'])`): `network: "Arc Testnet (Chain ID 5042002)"`
  - `scripts/setupRealtimeArc.js:20` (in top-level script execution): `const chainId = 5042002;`
- **RPC Endpoint:** `https://rpc.testnet.arc.io` / `https://rpc.testnet.arc.circle.com`.
- **Settlement Tokens:**
  - Circle USDC (Native 6 decimals).
  - Ondo USYC Vault (`0xD9331d5C68e5cf3905BafAD867Fb26572E2153aC`).
- **External APIs:**
  - OpenSanctions REST API (`api.opensanctions.org`).
  - Supervisor Webhook endpoint (`SUPERVISOR_WEBHOOK_URL`).
