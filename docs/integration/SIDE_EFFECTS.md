# Backend Architecture & Side-Effects Audit (Read-Only Analysis)

**Reference Target:** `origin/main` (commit `5bf7968`) via detached worktree `../backend-origin-main-ref`  
**Execution Status:** Read-only static analysis. No commands, node processes, or tests were executed inside the worktree.

---

## 1. Boot Sequence & On-Chain State Sync

When `server.js` is executed directly (`node server.js`):
1. **Environment Loading:** `require('dotenv').config()` loads local `.env`.
2. **Instance Construction:** `new VestiarionAgent()` instantiates:
   - `CashFlowForecaster` (in-memory math).
   - `OpenSanctionsVerifier` (REST client for sanctions screening).
   - `EuthynaAuditLedger` (initializes filesystem storage paths in `ledger/`).
   - `CircleStackService` (Ethers provider + Circle Paymaster bindings).
   - `SupervisorNotifier` (webhook dispatcher).
   - Static contracts (`usdcContract`, `policyContract` if artifacts exist).
   - Signers (`agentSigner`, `ownerSigner`) if private keys are populated.
3. **Boot Trigger:** `agent.syncOnChainState().then(() => app.listen(PORT))`
   - **Does it write files (`ledger/`)?** **NO.** `syncOnChainState()` (`services/agentRunner.js:106-128`) only queries RPC endpoints via `Promise.all` (`balanceOf`, `spentToday`, `dailyLimit`, `maxSingleTx`, `escalationNonce`). It performs zero filesystem I/O.
   - **Does it send on-chain transactions?** **NO.** All invoked methods on the ERC20 and `PolicyWallet` contracts are read-only `view` functions. No gas is spent, and no transactions are broadcast during boot.

### Seed Functions Audit: `seedInitialState` vs `scripts/seedInvoices.js`
1. **`seedInitialState()` (`server.js:51-73`):**
   - **What it does:** Processes two synthetic invoices through `agent.processIncomingInvoice()`:
     - User #1: 120.00 USDC to `0x3333333333333333333333333333333333333333` (Infrastructure). Sponsors gasless payout via Circle Paymaster, updates state, and appends to `ledger/euthyna.beancount` and `ledger/receipts.json`.
     - User #2: 400.00 USDC to `0x6666666666666666666666666666666666666666` (Vendor, exceeds 250 USDC cap). Queues an escalation and broadcasts an on-chain `requestEscalatedPayout` transaction if `agentSigner` is configured.
   - **When is it called?** **NEVER on standard boot or request.** In `server.js`, it is defined at line 51 but is **not** called in `if (require.main === module)` (lines 239-249). It exists as an uncalled helper function.
   - **Side effects if executed:** **YES.** Writes directly to `ledger/` files and broadcasts on-chain transactions.
2. **`scripts/seedInvoices.js` (`scripts/seedInvoices.js:1-46`):**
   - **What it does:** Instantiates `new VestiarionAgent()` and loops through three batch bills (85 USDC AWS bill, 150 USDC Anthropic bill, 350 USDC ZK bounty).
   - **When is it run?** Only when explicitly invoked via `npm run seed` (`node scripts/seedInvoices.js`).
   - **Side effects:** **YES.** Appends multiple transactions to `ledger/euthyna.beancount`, writes to `ledger/receipts.json`, and submits an on-chain escalation transaction for the 350 USDC bounty if `AGENT_PRIVATE_KEY` is present.

---

## 2. AgentRunner Dynamics, Security & Autonomous Actions

### Autonomous Loops & Timers
- `agentRunner.js` and `server.js` contain **zero** autonomous background timers (`setInterval`, `setTimeout`, or cron loops).
- All agent actions are strictly **event-driven and reactive**, triggered by incoming HTTP requests to `/api/invoices/process`, `/api/treasury/sweep`, `/api/treasury/redeem`, or `/api/escalations/:id/approve`.

### On-Chain Escalation Triggers
An incoming invoice to `POST /api/invoices/process` triggers an on-chain escalation (`PolicyWallet.requestEscalatedPayout` in `services/agentRunner.js:203-242`) when:
1. `amountUsdc > maxSingleTx` (threshold: **250.00 USDC**).
2. Global daily limit is breached: `(spentToday + amountUsdc) > dailyLimit` (limit: **1000.00 USDC**).
3. Category daily limit is breached: `(categorySpentToday[cat] + amountUsdc) > categoryLimits[cat]` (Infrastructure: 500, Payroll: 800, SaaS: 300, Vendor: 400 USDC).

When any threshold is exceeded:
- If `policyContract` and `agentSigner` are configured, the agent broadcasts an on-chain transaction calling `requestEscalatedPayout(...)` using `this.agentSigner`.
- The escalation is queued in-memory (`this.pendingTransactions`), assigned a deterministic `txId` via `keccak256`, and dispatched to the supervisor webhook via `SupervisorNotifier`.

### Signing Key Environment Variable Names (NAME ONLY)
The signing keys are loaded strictly from:
- **`AGENT_PRIVATE_KEY`** (`services/agentRunner.js:52`) — Agent signer for automated actions and requesting escalations.
- **`DEPLOYER_PRIVATE_KEY`** (`services/agentRunner.js:52, 58`) — Owner/Deployer signer for approving escalated payouts and contract deployments.

### Authentication, Rate Limiting & CORS Exposure Analysis
Facts directly from active code:
1. **Wildcard CORS (`server.js:13`):**
   ```javascript
   app.use(cors());
   ```
   No origin filtering, headers restriction, or credentials gating is applied. Any origin (`*`) is accepted.
2. **Zero Authentication on Mutating Routes (`server.js:123-207`):**
   None of the 5 mutating endpoints have authentication middleware, session checks, bearer token validation, or API key verification.
3. **Zero Rate Limiting:**
   No rate limiter (e.g. `express-rate-limit`) is installed or mounted anywhere in `server.js`.
4. **Critical Unauthorized Owner Privilege Escalation (`server.js:186-195` & `agentRunner.js:358-390`):**
   In `server.js:188`:
   ```javascript
   const caller = req.body.callerAddress || agent.ownerAddress;
   const result = await agent.approveEscalatedPayout(txId, caller);
   ```
   In `agentRunner.js:358`:
   ```javascript
   async approveEscalatedPayout(txId, callerAddress = this.ownerAddress) {
       if (callerAddress.toLowerCase() !== this.ownerAddress.toLowerCase()) {
           throw new Error(`Caller is not owner. OwnableUnauthorizedAccount(${callerAddress})`);
       }
   ```
   **Security Fact:** If an unauthenticated caller sends an empty JSON body `{}` to `POST /api/escalations/:id/approve`, `caller` defaults directly to `agent.ownerAddress`! The agent then checks `callerAddress === this.ownerAddress`, passes the check without verifying any signature or secret, connects `this.ownerSigner` to `policyContract.approveAndExecuteEscalatedPayout(txId)`, and broadcasts an on-chain owner approval to Arc L1!
5. **Impact:**
   Anyone on the local network (or any website in a browser via CSRF due to wildcard CORS) can:
   - Drain USYC reserves via `POST /api/treasury/sweep` and `/api/treasury/redeem`.
   - Execute payouts via `POST /api/invoices/process`.
   - Force owner approval of any pending transaction via `POST /api/escalations/:id/approve` using the server's configured private keys.

---

## 3. Endpoint State Classification Matrix

| Endpoint | Method | Code Location | State Classification | Description & Side Effects |
| :--- | :--- | :--- | :--- | :--- |
| `/api` | `GET` | `server.js:80` | **Read-Only** | Service catalog & discovery metadata. |
| `/api/treasury/summary` | `GET` | `server.js:101` | **Read-Only** | Queries on-chain balances, forecasts, and returns JSON. |
| `/api/treasury/gateway-reserves` | `GET` | `server.js:112` | **Read-Only** | Queries multi-chain Circle Gateway balances. |
| `/api/invoices` | `GET` | `server.js:146` | **Read-Only** | Returns in-memory processed invoices and pending escalations. |
| `/api/escalations` | `GET` | `server.js:180` | **Read-Only** | Returns all in-memory pending escalations. |
| `/api/audit/beancount` | `GET` | `server.js:223` | **Read-Only** | Synchronously reads and returns `ledger/euthyna.beancount`. |
| `/api/audit/receipts` | `GET` | `server.js:231` | **Read-Only** | Synchronously reads and returns `ledger/receipts.json`. |
| `/api/sanctions/check` | `POST` | `server.js:210` | **Read-Only** (External Query) | Screens address via external OpenSanctions REST API. |
| `/api/invoices/process` | `POST` | `server.js:158` | **STATE-CHANGING** | Sponsors payout via Paymaster, updates state, **appends to `ledger/euthyna.beancount` and writes `ledger/receipts.json`**. If limit exceeded, broadcasts on-chain escalation transaction. |
| `/api/escalations/:id/approve` | `POST` | `server.js:186` | **STATE-CHANGING** | Approves escalation, broadcasts on-chain owner approval transaction, and **writes to `ledger/` files**. |
| `/api/escalations/:id/cancel` | `POST` | `server.js:198` | **STATE-CHANGING** | Mutates in-memory transaction status (`cancelled = true`). |
| `/api/treasury/sweep` | `POST` | `server.js:123` | **STATE-CHANGING** | Sweeps surplus liquid USDC into USYC vault, **appends to `ledger/` files**. |
| `/api/treasury/redeem` | `POST` | `server.js:133` | **STATE-CHANGING** | Redeems USYC back to USDC, **appends to `ledger/` files**. |

---

## 4. Ledger File Mutation (`euthyna.beancount` & `receipts.json`)

### Production & Ingestion Mechanism
- **File Paths:**
  - `ledger/euthyna.beancount`
  - `ledger/receipts.json`
- **Producer:** `services/euthynaAudit.js` (`EuthynaAuditLedger`).
  - `recordPayoutExecution()`: Appends double-entry journal lines to `euthyna.beancount` (`fs.appendFileSync`) and writes formatted JSON-LD receipt to `receipts.json` (`fs.writeFileSync`).
  - `recordYieldSweep()`: Appends yield sweep journal lines and writes JSON-LD receipt.
  - `recordYieldRedemption()`: Appends JIT redemption journal lines and writes JSON-LD receipt.
- **Consumer:**
  - Express routes `GET /api/audit/beancount` and `GET /api/audit/receipts` read these files synchronously from disk (`fs.readFileSync`) and stream them to the client.

### Segregation Enforcement
- **Crucial Rule:** The frontend must **never** read or import `ledger/euthyna.beancount` or `ledger/receipts.json` directly from the filesystem.
- Because these files are version-controlled and maintained on `origin/main` by the backend engineer, **running `server.js` or executing test scripts inside this repository will write new entries to `ledger/` and dirty protected git files.**

---

## 5. API Service Catalog & Route Verification

The service discovery index (`GET /api`) was verified against the Express routing table in `server.js`:

| Catalog Key | Catalog Route | Verified in Code | Actual Handler Implementation |
| :--- | :--- | :--- | :--- |
| `treasurySummary` | `GET /api/treasury/summary` | **Yes** (`server.js:101`) | `agent.getTreasurySummary()` |
| `gatewayReserves` | `GET /api/treasury/gateway-reserves` | **Yes** (`server.js:112`) | `agent.circleStack.getMultichainReserves()` |
| `processInvoice` | `POST /api/invoices/process` | **Yes** (`server.js:158`) | `agent.processIncomingInvoice(req.body)` |
| `pendingEscalations` | `GET /api/escalations` | **Yes** (`server.js:180`) | `Array.from(agent.pendingTransactions.values())` |
| `approveEscalation` | `POST /api/escalations/:id/approve` | **Yes** (`server.js:186`) | `agent.approveEscalatedPayout(id, caller)` |
| `cancelEscalation` | `POST /api/escalations/:id/cancel` | **Yes** (`server.js:198`) | `agent.cancelEscalatedPayout(id, caller)` |
| `sweepYield` | `POST /api/treasury/sweep` | **Yes** (`server.js:123`) | `agent.sweepSurplusYield()` |
| `redeemYield` | `POST /api/treasury/redeem` | **Yes** (`server.js:133`) | `agent.redeemUsyc(amount)` |
| `beancountLedger` | `GET /api/audit/beancount` | **Yes** (`server.js:223`) | `agent.auditLedger.getBeancountLedger()` |
| `jsonLdReceipts` | `GET /api/audit/receipts` | **Yes** (`server.js:231`) | `agent.auditLedger.getReceipts()` |

**Uncataloged Additional Routes Found in `server.js`:**
- `GET /api/invoices` (`server.js:146`): Returns both processed invoices and pending escalations.
- `POST /api/sanctions/check` (`server.js:210`): Queries `OpenSanctionsVerifier.screenRecipient()`.

---

## 6. CORS Configuration & Frontend Serving

- **CORS Config:** Configured with `app.use(cors())` with default wildcard options (`Access-Control-Allow-Origin: *`).
  - **Is the Vite dev origin allowed?** **YES.** Requests originating from `http://localhost:5173` are fully permitted.
- **Frontend Serving:**
  - Express serves static files from `public/` via `app.use(express.static(path.join(__dirname, 'public')))`.
  - Root route `GET /` serves `public/index.html`.
  - Additional static routes serve `frontend.html`, `landing.html`, and `supernova_app.html`.
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
| `npm run dev` | Frontend (local branch) | Launches Vite development server on port 5173. *(Note: On origin/main, "dev" pointed to `node server.js`)*. | **Frontend Dev Server** |
| `npm run server` | Frontend (local branch) | Alias to run `node server.js` on port 4000 without clashing with Vite dev. | **Backend Runtime** |
| `npm run build` | Frontend (local branch) | Executes `tsc && vite build` to generate `dist/`. | **Frontend Build** |
| `npm run preview` | Frontend (local branch) | Previews built bundle via `vite preview`. | **Frontend Preview** |

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
