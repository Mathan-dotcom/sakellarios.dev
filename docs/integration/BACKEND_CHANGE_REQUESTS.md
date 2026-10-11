# Backend Change Requests & Security Observations

**Document Purpose:** Security and architecture feedback for the backend engineer based on static code analysis of `origin/main` (`server.js`, `services/agentRunner.js`, `services/euthynaAudit.js`).  
**Status:** Observation only. No backend code has been or will be altered by the frontend team.

---

## 1. CRITICAL: Unauthenticated Owner Privilege Escalation on Escalation Approval

### Location & Function Citations
- `server.js:186-195` (Route handler `app.post('/api/escalations/:id/approve')`)
- `services/agentRunner.js:388-457` (Method `VestiarionAgent.prototype.approveEscalatedPayout`)
- `services/agentRunner.js:55-64` (Signer setup in `VestiarionAgent.prototype.constructor`)
- `server.js:16` (`app.use(cors())`)

### Code Observation
In `server.js` lines 186–195 (`app.post('/api/escalations/:id/approve')`):
```javascript
app.post('/api/escalations/:id/approve', async (req, res) => {
    try {
        const txId = req.params.id;
        const caller = req.body.callerAddress || agent.ownerAddress;
        const result = await agent.approveEscalatedPayout(txId, caller);
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});
```
In `services/agentRunner.js` lines 388–391 and lines 416–425 (`approveEscalatedPayout`):
```javascript
async approveEscalatedPayout(txId, callerAddress = this.ownerAddress) {
    if (callerAddress.toLowerCase() !== this.ownerAddress.toLowerCase()) {
        throw new Error(`Caller is not owner. OwnableUnauthorizedAccount(${callerAddress})`);
    }
    ...
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
...
```
In `services/agentRunner.js` lines 60–64 (`constructor`):
```javascript
    // Live Owner Signer if available
    const ownerKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (ownerKey && (ownerKey.length === 64 || ownerKey.length === 66)) {
        this.ownerSigner = new ethers.Wallet(ownerKey, this.provider);
    }
```

### Risk & Vulnerability Analysis
1. **Bypassing the Authorization Check:** If an unauthenticated caller sends an empty JSON payload `{}` or omits `callerAddress` in a `POST /api/escalations/:id/approve` request, `server.js:189` defaults `caller` to `agent.ownerAddress`. In `agentRunner.js:389`, `callerAddress.toLowerCase() !== this.ownerAddress.toLowerCase()` evaluates to `false`, completely bypassing the ownership check without requiring any cryptographic signature (EIP-712 / `personal_sign`), API secret, or session token.
2. **Which Signer Sends the Transaction:** At line 418, the contract call connects `this.ownerSigner`. As defined in `agentRunner.js:61`, `this.ownerSigner` is funded using the deployer/owner private key (`DEPLOYER_PRIVATE_KEY`).
3. **Execution Depends on Environment Keys:**
   - **With Keys (`DEPLOYER_PRIVATE_KEY` present in `.env`):** Any unauthenticated network client can trigger the server to broadcast an authentic on-chain transaction signed by the owner wallet calling `PolicyWallet.approveAndExecuteEscalatedPayout(txId)` on Arc L1.
   - **Without Keys (No private keys configured):** `this.ownerSigner` is `undefined`. No on-chain transaction can be sent. However, the server still marks the escalation as executed in-memory (`pTx.executed = true`), increments spending, triggers the simulated Circle Paymaster payout, and appends a simulated settlement receipt to `ledger/receipts.json` and `ledger/euthyna.beancount`.
4. **Combined with Wildcard CORS (`server.js:16: app.use(cors())`):** Because CORS allows all origins (`*`) with zero authentication, any website visited by a supervisor in the same network context could issue cross-origin requests approving arbitrary payouts.

### Recommended Remedy
1. Require EIP-712 typed data signatures from the owner wallet in the approval request payload and verify `ethers.verifyTypedData()` or `ethers.recoverAddress()` before connecting `ownerSigner`.
2. Do not fallback to `agent.ownerAddress` if `callerAddress` is missing.
3. Protect administrative routes behind an authenticated session, JWT, or Bearer token secret (`SUPERVISOR_API_KEY`).

---

## 2. CRITICAL: Swallowed On-Chain Failures Recorded as Settled in Ledger

### Location & Function Citations
- `services/agentRunner.js:416-456` (In method `VestiarionAgent.prototype.approveEscalatedPayout`)
- `services/agentRunner.js:227-298` (In method `VestiarionAgent.prototype.processIncomingInvoice`)
- `services/euthynaAudit.js:64-136` (Method `EuthynaAuditLedger.prototype.recordPayoutExecution`)

### Code Observation: Approval Path
In `services/agentRunner.js` lines 416–456 (`approveEscalatedPayout`):
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

        pTx.ownerApproved = true;
        pTx.executed = true;
        this.spentToday += pTx.amount;
        this.categorySpentToday[pTx.category] = (this.categorySpentToday[pTx.category] || 0) + pTx.amount;
        this.liquidUsdcBalance -= pTx.amount;

        // Euthyna audit
        const auditLog = this.auditLedger.recordPayoutExecution({
            txHash: paymasterReceipt.txHash,
            agentId: this.agentAddress,
            policyAddress: this.walletAddress,
            vendorAddress: pTx.vendor,
            amountUsdc: pTx.amount,
            category: pTx.category,
            invoiceRef: pTx.invoiceRef,
            dailyLimitRemaining: this.dailyLimit - this.spentToday,
            sanctionsResult: { provider: "OpenSanctions API", status: "CLEAN", queriedAt: new Date().toISOString() },
            redeemedFromUsyc: false,
            liquidUsdcAvailable: this.liquidUsdcBalance,
            escalationNonce: this.escalationNonce
        });

        pTx.txHash = paymasterReceipt.txHash;
        return {
            success: true,
            status: "APPROVED_AND_EXECUTED",
            txHash: paymasterReceipt.txHash,
            pendingTx: pTx,
            auditLog
        };
```

### Code Observation: Escalation Request Path
In `services/agentRunner.js` lines 227–245 and 278–298 (`processIncomingInvoice`):
```javascript
            if (this.policyContract && this.agentSigner) {
                try {
                    const reasoningHash = ethers.keccak256(ethers.toUtf8Bytes(reasoning || `Invoice ${invoiceRef} exceeds limit threshold`));
                    const catHash = ethers.keccak256(ethers.toUtf8Bytes(cat));
                    const amtUnits = ethers.parseUnits(amountUsdc.toString(), 6);
                    const tx = await this.policyContract.connect(this.agentSigner).requestEscalatedPayout(
                        vendorAddress,
                        amtUnits,
                        catHash,
                        invoiceRef,
                        reasoningHash
                    );
                    const receipt = await tx.wait();
                    onChainTxHash = receipt.hash;
                    console.log(`[Vestiarion Agent] On-Chain Escalation Submitted: ${receipt.hash}`);
                } catch (err) {
                    console.warn(`[Vestiarion Agent] On-chain escalation dispatch notice: ${err.message}`);
                }
            }
            this.escalationNonce++;
            ...
            this.pendingTransactions.set(txId, pendingTx);
            ...
            return {
                success: true,
                status: "ESCALATED_PENDING_APPROVAL",
                escalation: pendingTx,
                sanctionsResult,
                message: `Invoice #${invoiceRef} submitted to on-chain pending approval queue. Supervisor alert sent.`
            };
```

### Risk & Defect Analysis
1. **Approval Path**: When on-chain execution `approveAndExecuteEscalatedPayout(txId)` throws (e.g. out of gas, contract revert, invalid nonce, RPC failure), the `catch` block merely logs a `console.warn`. The code immediately proceeds to:
   - Mark `pTx.ownerApproved = true` and `pTx.executed = true`.
   - Deduct `this.liquidUsdcBalance -= pTx.amount`.
   - Call `this.auditLedger.recordPayoutExecution(...)`.
   - Inscribe a journal entry into `ledger/euthyna.beancount` and append a receipt to `ledger/receipts.json` containing the simulated hash from line 408 (`paymasterReceipt.txHash`).
   - Return `{ status: "APPROVED_AND_EXECUTED" }`.
   **Result:** A failed or reverted on-chain transaction is recorded in the permanent audit ledger as a fully settled payout.
2. **Escalation Request Path**: When `requestEscalatedPayout(...)` fails or reverts on-chain, the error is caught and ignored. The server still stores `pendingTx` into `this.pendingTransactions`, increments `this.escalationNonce`, and claims in its response that the invoice was "submitted to on-chain pending approval queue". Subsequently, if a supervisor attempts to approve this transaction on-chain, the smart contract reverts because the transaction was never recorded on-chain.

### Recommended Remedy
1. Do not swallow on-chain reverts in `approveEscalatedPayout`. If on-chain execution fails, the method must abort, mark the escalation status as `EXECUTION_FAILED`, and avoid deducting treasury balances.
2. Ledger entries must explicitly record whether on-chain execution succeeded (`onChainExecution: "SUCCESS" | "FAILED"`), and failed payouts must never be written to `euthyna.beancount` or `receipts.json` as settled disbursements.

---

## 3. HIGH: Mutating Endpoints Lack Authentication & Rate Limiting

### Location & Function Citations
- `server.js:16` (`app.use(cors())`)
- `server.js:123-130` (Route handler `app.post('/api/treasury/sweep')`)
- `server.js:133-144` (Route handler `app.post('/api/treasury/redeem')`)
- `server.js:158-177` (Route handler `app.post('/api/invoices/process')`)
- `server.js:198-207` (Route handler `app.post('/api/escalations/:id/cancel')`)

### Code Observation
- Wildcard CORS is enabled globally: `app.use(cors())` (`server.js:16`).
- None of the 4 state-changing routes have authentication middleware or rate limiting.
- Any network client can repeatedly call `/api/invoices/process` to exhaust daily category limits, drain USDC via Circle Paymaster payouts, trigger on-chain transaction spam (`requestEscalatedPayout`), or cause runaway growth of `ledger/euthyna.beancount` and `ledger/receipts.json`.

### Recommended Remedy
1. Install `express-rate-limit` to restrict request frequency on mutating endpoints.
2. Restrict CORS origins to trusted frontend domains (`origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173']`).
3. Require HMAC webhook signatures or API keys for invoice ingestion from automated partners.

---

## 4. HIGH: Chain ID Configuration Discrepancy (.env.example vs Runtime Code)

### Location & Function Citations
- `.env.example:5`: `ARC_CHAIN_ID=42111`
- `services/agentRunner.js:34` (In `VestiarionAgent.prototype.constructor`): `this.chainId = parseInt(process.env.ARC_CHAIN_ID || "5042002");`
- `services/circleStack.js:15` (In `CircleStackService.prototype.constructor`): `this.chainId = parseInt(process.env.ARC_CHAIN_ID || "5042002");`
- `server.js:84` (In handler `app.get(['/api', '/api/'])`): `network: "Arc Testnet (Chain ID 5042002)",`
- `scripts/setupRealtimeArc.js:20` (In script execution): `const chainId = 5042002;`

### Code Observation & Impact
- `.env.example` sets `ARC_CHAIN_ID=42111`, while all active operational backend code and setup scripts default to `5042002`.
- Anyone copying `.env.example` to `.env` as documented silently overrides the runtime default with an invalid/stale Chain ID (`42111`), breaking RPC communication, contract calls, and provider network validation.

### Recommended Remedy
- Update `.env.example:5` to `ARC_CHAIN_ID=5042002` to align with the authoritative Arc Testnet deployment.

---

## 5. HIGH: Non-Atomic Read-Modify-Write & Race Condition on `receipts.json`

### Location & Function Citations
- `services/euthynaAudit.js:128-130` (In method `recordPayoutExecution`)
- `services/euthynaAudit.js:166-168` (In method `recordYieldSweep`)
- `services/euthynaAudit.js:203-205` (In method `recordYieldRedemption`)

### Code Observation & Impact
In `services/euthynaAudit.js`:
```javascript
const currentReceipts = JSON.parse(fs.readFileSync(this.receiptsFile, 'utf8'));
currentReceipts.push(jsonLdReceipt);
fs.writeFileSync(this.receiptsFile, JSON.stringify(currentReceipts, null, 2), 'utf8');
```
Because `fs.readFileSync`, `push`, and `fs.writeFileSync` execute synchronously with zero `await` statements in Node's single-threaded event loop, two concurrent HTTP requests handled by the same Node.js process cannot interrupt each other or drop entries during this synchronous block.

However, two real filesystem hazards exist:
1. **Multi-Process Concurrency Overwrites:** If another external process writes to the ledger files simultaneously (such as `npm run seed` via `scripts/seedInvoices.js`, automated integration tests, or a second worker/server cluster instance), concurrent read-modify-write cycles across separate OS processes will race and overwrite each other's appended records.
2. **Crash Mid-Write Corruption (Non-Atomic Write):** `fs.writeFileSync` writes directly to the destination file without an atomic write-and-rename pattern (`tempFile` -> `fs.renameSync`). If the server process crashes, runs out of disk space, or is terminated by the OS/container orchestrator mid-write, `ledger/receipts.json` is left truncated or corrupted, resulting in invalid JSON that crashes subsequent server boots.

### Recommended Remedy
- Implement atomic file writes using a temporary file and `fs.renameSync` (or an atomic write package like `write-file-atomic`).
- Consider an append-only JSON Lines format (`receipts.jsonl`) to align with `euthyna.beancount`'s append-only semantics.

---

## 6. MEDIUM: Indistinguishable Simulated vs. On-Chain Transaction Hashes

### Location & Function Citations
- `services/circleStack.js:94` (In method `sponsorAndExecutePayout`): `const paymasterTxHash = "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join("");`
- `services/agentRunner.js:498` (In method `sweepSurplusYield`): `const txHash = "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join("");`
- `services/agentRunner.js:527` (In method `redeemUsyc`): `const txHash = "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join("");`
- Contrast with `services/agentRunner.js:420` (In method `approveEscalatedPayout`): `paymasterReceipt.txHash = receipt.hash;` (real on-chain receipt from `approveAndExecuteEscalatedPayout`).

### Code Observation & Impact
- In `ledger/receipts.json` and `euthyna.beancount`, simulated random 64-hex strings and real on-chain transaction hashes both occupy the identical `txHash` / `meta-tx-hash` field with no distinguishing marker or status enum.
- Consumers (such as frontend audits or blockchain explorers) cannot determine whether an entry represents an actual Arc L1 on-chain transaction or a simulated local mock.

### Recommended Remedy
- Add an explicit field such as `txKind: "onchain" | "simulated"` or `executionMode: "LIVE_CHAIN" | "MOCK_PAYMASTER"` to `AgentExecutionReceipt` in `euthynaAudit.js`.

---

## 7. ARCHITECTURE: Canonical Entry Identifiers & Structured Slabs Endpoint

### Location & Function Citations
- `server.js:224-231` (Route handler `app.get('/api/audit/beancount')`)
- `ledger/receipts.json`

### Code Observation
- Neither `ledger/receipts.json` nor `ledger/euthyna.beancount` assigns canonical sequential identifiers (e.g. `"EUTHYNA #00481"`).
- `/api/audit/beancount` returns raw double-entry accounting plain text (`text/plain`), requiring complex text parsing in the client.

### Recommended Remedy
- Provide a dedicated structured endpoint, such as `GET /api/audit/slabs`, returning a normalized JSON array with canonical entry indices, on-chain verification flags, and formatted metadata.
