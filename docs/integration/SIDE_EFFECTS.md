# Backend Architecture & Side-Effects Audit (Read-Only Analysis)

**Reference Target:** `origin/main` (commit `5bf7968`) via detached worktree `../backend-origin-main-ref`  
**Execution Status:** Read-only static analysis. No commands, node processes, or tests were executed inside the worktree.

---

## 1. Boot Sequence & On-Chain State Sync

When `server.js` is executed directly (`node server.js`):
1. **Environment Loading:** `require('dotenv').config()` (`server.js:7`) loads local `.env`.
2. **Instance Construction:** `new VestiarionAgent()` (`server.js:46`) instantiates:
   - `CashFlowForecaster` (in-memory math).
   - `OpenSanctionsVerifier` (REST client for sanctions screening).
   - `EuthynaAuditLedger` (initializes filesystem storage paths in `ledger/`).
   - `CircleStackService` (Ethers provider + Circle Paymaster bindings).
   - `SupervisorNotifier` (webhook dispatcher).
   - Static contracts (`usdcContract`, `policyContract` if artifacts exist).
   - Signers (`agentSigner`, `ownerSigner`) if private keys are populated.
3. **Boot Trigger:** `agent.syncOnChainState().then(() => app.listen(PORT))` (`server.js:245` in main block):
   - **Does it write files (`ledger/`)?** **NO.** Method `VestiarionAgent.prototype.syncOnChainState` (`services/agentRunner.js:108-137`) only queries RPC endpoints via `Promise.all` (`balanceOf`, `spentToday`, `dailyLimit`, `maxSingleTx`, `escalationNonce`). It performs zero filesystem I/O.
   - **Does it send on-chain transactions?** **NO.** All invoked methods on the ERC20 and `PolicyWallet` contracts are read-only `view` functions. No gas is spent, and no transactions are broadcast during boot.

### Seed Functions Audit: `seedInitialState` vs `scripts/seedInvoices.js`
1. **`seedInitialState()` (`server.js:51-73`, function declaration `async function seedInitialState()`):**
   - **What it does:** Processes two synthetic invoices through `agent.processIncomingInvoice()`:
     - User #1: 120.00 USDC to `0x3333333333333333333333333333333333333333` (Infrastructure). Sponsors gasless payout via Circle Paymaster, updates state, and appends to `ledger/euthyna.beancount` and `ledger/receipts.json`.
     - User #2: 400.00 USDC to `0x6666666666666666666666666666666666666666` (Vendor, exceeds 250 USDC cap). Queues an escalation and broadcasts an on-chain `requestEscalatedPayout` transaction if `agentSigner` is configured.
   - **When is it called?** **NEVER on standard boot or request.** In `server.js`, it is defined at line 51 but is **not** called in `if (require.main === module)` (`server.js:244-257`). It exists as an uncalled helper function.
   - **Side effects if executed:** **YES.** Writes directly to `ledger/` files and broadcasts on-chain transactions.
2. **`scripts/seedInvoices.js` (`scripts/seedInvoices.js:1-46`, top-level script):**
   - **What it does:** Instantiates `new VestiarionAgent()` and loops through three batch bills (85 USDC AWS bill, 150 USDC Anthropic bill, 350 USDC ZK bounty).
   - **When is it run?** Only when explicitly invoked via `npm run seed` (`node scripts/seedInvoices.js`).
   - **Side effects:** **YES.** Appends multiple transactions to `ledger/euthyna.beancount`, writes to `ledger/receipts.json`, and submits an on-chain escalation transaction for the 350 USDC bounty if `AGENT_PRIVATE_KEY` is present.

---

## 2. AgentRunner Dynamics, Security & Autonomous Actions

### Autonomous Loops & Timers
- `agentRunner.js` and `server.js` contain **zero** autonomous background timers (`setInterval`, `setTimeout`, or cron loops).
- All agent actions are strictly **event-driven and reactive**, triggered by incoming HTTP requests to `/api/invoices/process`, `/api/treasury/sweep`, `/api/treasury/redeem`, or `/api/escalations/:id/approve`.

### On-Chain Escalation Triggers
An incoming invoice to `POST /api/invoices/process` triggers an on-chain escalation (`PolicyWallet.requestEscalatedPayout` in method `VestiarionAgent.prototype.processIncomingInvoice` at `services/agentRunner.js:225-245`) when:
1. `amountUsdc > maxSingleTx` (threshold: **250.00 USDC**).
2. Global daily limit is breached: `(spentToday + amountUsdc) > dailyLimit` (limit: **1000.00 USDC**).
3. Category daily limit is breached: `(categorySpentToday[cat] + amountUsdc) > categoryLimits[cat]` (Infrastructure: 500, Payroll: 800, SaaS: 300, Vendor: 400 USDC).

When any threshold is exceeded:
- If `policyContract` and `agentSigner` are configured, the agent broadcasts an on-chain transaction calling `requestEscalatedPayout(...)` using `this.agentSigner` (`agentRunner.js:232`).
- The escalation is queued in-memory (`this.pendingTransactions`, line 278), assigned a deterministic `txId` via `keccak256` (lines 251-256), and dispatched to the supervisor webhook via `SupervisorNotifier` (lines 281-288).

### Signing Key Environment Variable Names (NAME ONLY)
The signing keys are loaded strictly in `VestiarionAgent.prototype.constructor`:
- **`AGENT_PRIVATE_KEY`** (`services/agentRunner.js:55`) — Agent signer for automated actions and requesting escalations (`const agentKey = process.env.AGENT_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY`).
- **`DEPLOYER_PRIVATE_KEY`** (`services/agentRunner.js:55, 61`) — Owner/Deployer signer for approving escalated payouts and contract deployments (`const ownerKey = process.env.DEPLOYER_PRIVATE_KEY`).

### Authentication, Rate Limiting & CORS Exposure Analysis
Facts directly from active code:
1. **Wildcard CORS (`server.js:16`):**
   ```javascript
   app.use(cors());
   ```
   No origin filtering, headers restriction, or credentials gating is applied. Any origin (`*`) is accepted.
2. **Zero Authentication on Mutating Routes (`server.js:123-207`):**
   None of the 5 mutating endpoints (`/api/treasury/sweep`, `/api/treasury/redeem`, `/api/invoices/process`, `/api/escalations/:id/approve`, `/api/escalations/:id/cancel`) have authentication middleware, session checks, bearer token validation, or API key verification.
3. **Zero Rate Limiting:**
   No rate limiter (e.g. `express-rate-limit`) is installed or mounted anywhere in `server.js`.
4. **Critical Unauthorized Owner Privilege Escalation (`server.js:186-195` & `agentRunner.js:388-457`):**
   In `server.js:189` (in `app.post('/api/escalations/:id/approve')`):
   ```javascript
   const caller = req.body.callerAddress || agent.ownerAddress;
   const result = await agent.approveEscalatedPayout(txId, caller);
   ```
   In `agentRunner.js:388-391` (in `approveEscalatedPayout`):
   ```javascript
   async approveEscalatedPayout(txId, callerAddress = this.ownerAddress) {
       if (callerAddress.toLowerCase() !== this.ownerAddress.toLowerCase()) {
           throw new Error(`Caller is not owner. OwnableUnauthorizedAccount(${callerAddress})`);
       }
   ```
   In `agentRunner.js:416-425`:
   ```javascript
       if (this.policyContract && this.ownerSigner) {
           try {
               const tx = await this.policyContract.connect(this.ownerSigner).approveAndExecuteEscalatedPayout(txId);
               const receipt = await tx.wait();
               paymasterReceipt.txHash = receipt.hash;
               console.log(`[Vestiarion Agent] On-Chain Owner Approval Confirmed: ${receipt.hash}`);
           } catch (err) {
               console.warn(`[Vestiarion Agent] On-chain approval notice: ${err.message}`);
           }
       }
   ```
   **Security Fact:** If an unauthenticated caller sends an empty JSON body `{}` to `POST /api/escalations/:id/approve`, `caller` defaults directly to `agent.ownerAddress` at `server.js:189`. The agent checks `callerAddress.toLowerCase() === this.ownerAddress.toLowerCase()`, passes the check without verifying any signature or secret, connects `this.ownerSigner` (funded with `DEPLOYER_PRIVATE_KEY`), and broadcasts an on-chain owner approval to Arc L1! (If keys are absent, on-chain dispatch is skipped, but in-memory execution and ledger recording still occur).
5. **Impact:**
   Anyone on the local network (or any website in a browser via CSRF due to wildcard CORS) can:
   - Drain USYC reserves via `POST /api/treasury/sweep` and `/api/treasury/redeem`.
   - Execute payouts via `POST /api/invoices/process`.
   - Force owner approval of any pending transaction via `POST /api/escalations/:id/approve` using the server's configured private keys.

---

## 3. Endpoint State Classification Matrix

| Endpoint | Method | Code Location | State Classification | Description & Side Effects |
| :--- | :--- | :--- | :--- | :--- |
| `/api` | `GET` | `server.js:80-99` (handler `app.get(['/api', '/api/'])`) | **Read-Only** | Service catalog & discovery metadata. |
| `/api/treasury/summary` | `GET` | `server.js:103-110` (handler `app.get('/api/treasury/summary')`) | **Read-Only** | Queries on-chain balances, forecasts, and returns JSON. |
| `/api/treasury/gateway-reserves` | `GET` | `server.js:113-120` (handler `app.get('/api/treasury/gateway-reserves')`) | **Read-Only** | Queries multi-chain Circle Gateway balances. |
| `/api/invoices` | `GET` | `server.js:147-155` (handler `app.get('/api/invoices')`) | **Read-Only** | Returns in-memory processed invoices and pending escalations. |
| `/api/escalations` | `GET` | `server.js:180-183` (handler `app.get('/api/escalations')`) | **Read-Only** | Returns all in-memory pending escalations. |
| `/api/audit/beancount` | `GET` | `server.js:224-231` (handler `app.get('/api/audit/beancount')`) | **Read-Only** | Synchronously reads and returns `ledger/euthyna.beancount`. |
| `/api/audit/receipts` | `GET` | `server.js:234-241` (handler `app.get('/api/audit/receipts')`) | **Read-Only** | Synchronously reads and returns `ledger/receipts.json`. |
| `/api/sanctions/check` | `POST` | `server.js:210-221` (handler `app.post('/api/sanctions/check')`) | **Read-Only** (External Query) | Screens address via external OpenSanctions REST API. |
| `/api/invoices/process` | `POST` | `server.js:158-177` (handler `app.post('/api/invoices/process')`) | **STATE-CHANGING** | Sponsors payout via Paymaster, updates state, **appends to `ledger/euthyna.beancount` and writes `ledger/receipts.json`**. If limit exceeded, broadcasts on-chain escalation transaction. |
| `/api/escalations/:id/approve` | `POST` | `server.js:186-195` (handler `app.post('/api/escalations/:id/approve')`) | **STATE-CHANGING** | Approves escalation, broadcasts on-chain owner approval transaction, and **writes to `ledger/` files**. |
| `/api/escalations/:id/cancel` | `POST` | `server.js:198-207` (handler `app.post('/api/escalations/:id/cancel')`) | **STATE-CHANGING** | Mutates in-memory transaction status (`cancelled = true`). |
| `/api/treasury/sweep` | `POST` | `server.js:123-130` (handler `app.post('/api/treasury/sweep')`) | **STATE-CHANGING** | Sweeps surplus liquid USDC into USYC vault, **appends to `ledger/` files**. |
| `/api/treasury/redeem` | `POST` | `server.js:133-144` (handler `app.post('/api/treasury/redeem')`) | **STATE-CHANGING** | Redeems USYC back to USDC, **appends to `ledger/` files**. |

---

## 4. Ledger File Mutation (`euthyna.beancount` & `receipts.json`)

### Production & Ingestion Mechanism
- **File Paths:**
  - `ledger/euthyna.beancount`
  - `ledger/receipts.json`
- **Producer:** `services/euthynaAudit.js` (`EuthynaAuditLedger`).
  - `recordPayoutExecution()` (`euthynaAudit.js:64-136`): Appends double-entry journal lines to `euthyna.beancount` (`fs.appendFileSync`) and writes formatted JSON-LD receipt to `receipts.json` (`fs.writeFileSync`).
  - `recordYieldSweep()` (`euthynaAudit.js:138-174`): Appends yield sweep journal lines and writes JSON-LD receipt.
  - `recordYieldRedemption()` (`euthynaAudit.js:176-211`): Appends JIT redemption journal lines and writes JSON-LD receipt.
- **Consumer:**
  - Express routes `GET /api/audit/beancount` (`server.js:224`) and `GET /api/audit/receipts` (`server.js:234`) read these files synchronously from disk (`fs.readFileSync`) and stream them to the client.

### Segregation Enforcement
- **Crucial Rule:** The frontend must **never** read or import `ledger/euthyna.beancount` or `ledger/receipts.json` directly from the filesystem.
- Because these files are version-controlled and maintained on `origin/main` by the backend engineer, **running `server.js` or executing test scripts inside this repository will write new entries to `ledger/` and dirty protected git files.**

---

## 5. API Service Catalog & Route Verification

The service discovery index (`GET /api` in `server.js:80-99`) was verified against the Express routing table in `server.js`:

| Catalog Key | Catalog Route | Verified in Code | Actual Handler Implementation |
| :--- | :--- | :--- | :--- |
| `treasurySummary` | `GET /api/treasury/summary` | **Yes** (`server.js:103`) | `agent.getTreasurySummary()` |
| `gatewayReserves` | `GET /api/treasury/gateway-reserves` | **Yes** (`server.js:113`) | `agent.circleStack.getMultichainReserves()` |
| `processInvoice` | `POST /api/invoices/process` | **Yes** (`server.js:158`) | `agent.processIncomingInvoice(req.body)` |
| `pendingEscalations` | `GET /api/escalations` | **Yes** (`server.js:180`) | `Array.from(agent.pendingTransactions.values())` |
| `approveEscalation` | `POST /api/escalations/:id/approve` | **Yes** (`server.js:186`) | `agent.approveEscalatedPayout(id, caller)` |
| `cancelEscalation` | `POST /api/escalations/:id/cancel` | **Yes** (`server.js:198`) | `agent.cancelEscalatedPayout(id, caller)` |
| `sweepYield` | `POST /api/treasury/sweep` | **Yes** (`server.js:123`) | `agent.sweepSurplusYield()` |
| `redeemYield` | `POST /api/treasury/redeem` | **Yes** (`server.js:133`) | `agent.redeemUsyc(amount)` |
| `beancountLedger` | `GET /api/audit/beancount` | **Yes** (`server.js:224`) | `agent.auditLedger.getBeancountLedger()` |
| `jsonLdReceipts` | `GET /api/audit/receipts` | **Yes** (`server.js:234`) | `agent.auditLedger.getReceipts()` |

**Uncataloged Additional Routes Found in `server.js`:**
- `GET /api/invoices` (`server.js:147`): Returns both processed invoices and pending escalations.
- `POST /api/sanctions/check` (`server.js:210`): Queries `OpenSanctionsVerifier.screenRecipient()`.

---

## 6. CORS Configuration & Frontend Serving

- **CORS Config:** Configured with `app.use(cors())` (`server.js:16`) with default wildcard options (`Access-Control-Allow-Origin: *`).
  - **Is the Vite dev origin allowed?** **YES.** Requests originating from `http://localhost:5173` are fully permitted.
- **Frontend Serving:**
  - Express serves static files from `public/` via `app.use(express.static(path.join(__dirname, 'public')))` (`server.js:20`).
  - Root route `GET /` serves `public/index.html` (`server.js:24`).
  - Additional static routes serve `frontend.html`, `landing.html`, and `supernova_app.html` (`server.js:28-43`).
  - **Does Express serve the built frontend (`dist/`)?** **NO.** There is no route or static middleware mapping to `dist/`.

---

## 7. npm Scripts Audit

| Script Name | Origin/Context | Action & Purpose | Classification |
| :--- | :--- | :--- | :--- |
| `npm run test` | Backend | Runs Foundry tests (`forge.exe test`). | **Backend (Smart Contracts)** |
| `npm run test:forge` | Backend | Runs verbose Foundry tests (`forge.exe test -vvv`). | **Backend (Smart Contracts)** |
| `npm run test:agent` | Backend | Executes `node test/agentIntegration.test.js`. Processes simulated invoices and modifies `ledger/` files! | **Backend (Integration)** |
| `npm run build:contracts` | Backend | Compiles Solidity contracts via `forge.exe build`. | **Backend (Smart Contracts)** |
| `npm run seed` | Backend | Executes `node scripts/seedInvoices.js`. Ingests 3 test invoices and writes directly to `ledger/`. | **Backend (State Mutation)** |
| `npm run report` | Backend | Executes `node scripts/exportAuditReport.js` to parse `ledger/euthyna.beancount`. | **Backend (Audit Tool)** |
| `npm run deploy:arc` | Backend | Executes `node scripts/deploy.js` to broadcast contract deployments to Arc L1. | **Backend (On-Chain Mutation)** |
| `npm start` | Shared/Backend | Executes `node server.js` (starts Express server on port 4000). | **Backend Runtime** |
| `npm run dev` | Shared/Backend | Executes `node server.js` (identical to origin/main). | **Backend Runtime** |
| `npm run dev:ui` | Frontend (local branch) | Launches Vite development server on port 5173. Operator only. | **Frontend Dev Server** |
| `npm run build:ui` | Frontend (local branch) | Executes `tsc && vite build` to generate `dist/`. Safe build-only command. | **Frontend Build** |
| `npm run preview:ui` | Frontend (local branch) | Previews built bundle via `vite preview`. | **Frontend Preview** |

---

## 8. Required Environment Variable Names (from `.env.example`)

- `ARC_RPC_URL`
- `ARC_CHAIN_ID`
- `ARC_USDC_ADDRESS`
- `ARC_USYC_VAULT_ADDRESS`
- `POLICY_WALLET_ADDRESS`
- `CIRCLE_PAYMASTER_ADDRESS`
- `OPENSANCTIONS_API_KEY`
- `SUPERVISOR_WEBHOOK_URL`
- `DEPLOYER_PRIVATE_KEY` *(Signing key)*
- `AGENT_PRIVATE_KEY` *(Signing key)*
- `OWNER_ADDRESS`
- `PORT`

---

## 9. Safe Execution Evaluation & Recommendation

| Execution Method | Feasibility | Exact Risks | Segregation Impact |
| :--- | :--- | :--- | :--- |
| **1. Running Local `server.js` in this repo** | High | **High Risk:** Invoicing/sweeping actions write directly to `ledger/euthyna.beancount` and `ledger/receipts.json`, immediately dirtying protected git files. If signing keys are provided, will send live Arc testnet transactions. | ❌ **Violates Protected Paths** |
| **2. Friend's Hosted Instance / Staging Server** | High | **Low Repo Risk:** Zero local filesystem mutations. Network-dependent. State-changing actions will affect the friend's remote staging state/Arc testnet wallet. | ✅ **Clean Local Repo** |
| **3. Dry-Run Mode / Detached Scratch Storage** | Medium | **Low Risk:** Would require wrapping or configuring `storageDir` to write to temporary scratch paths outside the repo. Ensures zero dirty files, but requires custom mock harness. | ✅ **Clean Local Repo** |
| **4. Fixtures Only (Static / Mock Provider)** | Immediate | **Zero Risk:** Frontend consumes recorded JSON fixtures for GET/POST routes. Zero network dependencies, zero on-chain transactions, zero filesystem mutations. | ✅ **Completely Isolated** |

### Recommendation
1. **Primary Recommendation for Frontend UI Development:** **Fixtures Only / Local Mock Provider on Port 4010.** This guarantees 100% adherence to repository segregation: no protected `ledger/` files can be modified, and no unintended on-chain escalations can occur.
2. **For End-to-End Integration:** Connect Vite proxy to the **Friend's hosted/staging instance** rather than running `server.js` inside this workspace.
