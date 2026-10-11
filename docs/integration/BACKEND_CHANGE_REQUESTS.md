# Backend Change Requests & Security Observations

**Document Purpose:** Security and architecture feedback for the backend engineer based on static code analysis of `origin/main` (`server.js`, `services/agentRunner.js`, `services/euthynaAudit.js`).  
**Status:** Observation only. No backend code has been or will be altered by the frontend team.

---

## 1. CRITICAL: Unauthenticated Owner Privilege Escalation on Escalation Approval

### Location
- `server.js:186-195` (`POST /api/escalations/:id/approve`)
- `services/agentRunner.js:358-390` (`approveEscalatedPayout`)

### Code Observation
In `server.js`:
```javascript
app.post('/api/escalations/:id/approve', async (req, res) => {
    try {
        const txId = req.params.id;
        const caller = req.body.callerAddress || agent.ownerAddress;
        const result = await agent.approveEscalatedPayout(txId, caller);
        res.json({ success: true, data: result });
...
```
In `services/agentRunner.js`:
```javascript
async approveEscalatedPayout(txId, callerAddress = this.ownerAddress) {
    if (callerAddress.toLowerCase() !== this.ownerAddress.toLowerCase()) {
        throw new Error(`Caller is not owner. OwnableUnauthorizedAccount(${callerAddress})`);
    }
    ...
    if (this.policyContract && this.ownerSigner) {
        const tx = await this.policyContract.connect(this.ownerSigner).approveAndExecuteEscalatedPayout(txId);
...
```

### Risk & Vulnerability
- If an unauthenticated caller sends an empty JSON payload `{}` to `POST /api/escalations/:id/approve`, the server defaults `caller` to `agent.ownerAddress`.
- The ownership authorization check passes unconditionally without cryptographic signature verification (EIP-712 / `personal_sign`), API tokens, or session validation.
- The server then connects `this.ownerSigner` (funded with `DEPLOYER_PRIVATE_KEY`) to `policyContract` and broadcasts an on-chain owner transaction executing the payout.
- **Combined with `cors()` wildcard (`server.js:13`)**: Any malicious origin in an external browser session or any local network actor can approve arbitrary high-value payouts.

### Recommended Remedy
1. Require EIP-712 typed data signatures from the owner wallet in the approval request payload and verify `ethers.verifyTypedData()` or `ethers.recoverAddress()` before connecting `ownerSigner`.
2. Do not fallback to `agent.ownerAddress` if `callerAddress` is missing.
3. Protect administrative routes behind an authenticated session, JWT, or Bearer token secret (`SUPERVISOR_API_KEY`).

---

## 2. HIGH: Mutating Endpoints Lack Authentication & Rate Limiting

### Location
- `server.js:123` (`POST /api/treasury/sweep`)
- `server.js:133` (`POST /api/treasury/redeem`)
- `server.js:158` (`POST /api/invoices/process`)
- `server.js:198` (`POST /api/escalations/:id/cancel`)

### Code Observation
- Wildcard CORS is enabled globally: `app.use(cors())` (`server.js:13`).
- None of the 4 state-changing routes have authentication middleware or rate limiting.
- Any network client can repeatedly call `/api/invoices/process` to exhaust daily category limits, drain USDC via Circle Paymaster payouts, trigger on-chain transaction spam (`requestEscalatedPayout`), or cause runaway growth of `ledger/euthyna.beancount` and `ledger/receipts.json`.

### Recommended Remedy
1. Install `express-rate-limit` to restrict request frequency on mutating endpoints.
2. Restrict CORS origins to trusted frontend domains (`origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173']`).
3. Require HMAC webhook signatures or API keys for invoice ingestion from automated partners.

---

## 3. HIGH: Chain ID Configuration Discrepancy (.env.example vs Runtime Code)

### Location
- `.env.example:5`: `ARC_CHAIN_ID=42111`
- `services/agentRunner.js:34`: `this.chainId = parseInt(process.env.ARC_CHAIN_ID || "5042002");`
- `services/circleStack.js:15`: `this.chainId = parseInt(process.env.ARC_CHAIN_ID || "5042002");`
- `server.js:84`: `network: "Arc Testnet (Chain ID 5042002)",`
- `scripts/setupRealtimeArc.js:20`: `const chainId = 5042002;`

### Code Observation & Impact
- `.env.example` sets `ARC_CHAIN_ID=42111`, while all active operational backend code and setup scripts default to `5042002`.
- Anyone copying `.env.example` to `.env` as documented silently overrides the runtime default with an invalid/stale Chain ID (`42111`), breaking RPC communication, contract calls, and provider network validation.

### Recommended Remedy
- Update `.env.example:5` to `ARC_CHAIN_ID=5042002` to align with the authoritative Arc Testnet deployment.

---

## 4. HIGH: Non-Atomic Read-Modify-Write & Race Condition on `receipts.json`

### Location
- `services/euthynaAudit.js:128-130` (`recordPayoutExecution`)
- `services/euthynaAudit.js:166-168` (`recordYieldSweep`)
- `services/euthynaAudit.js:203-205` (`recordYieldRedemption`)

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

## 5. MEDIUM: Indistinguishable Simulated vs. On-Chain Transaction Hashes

### Location
- `services/circleStack.js:94`: `const paymasterTxHash = "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join("");`
- `services/agentRunner.js:498`: `const txHash = "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join("");` (sweep)
- `services/agentRunner.js:527`: `const txHash = "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join("");` (redeem)
- Contrast with `services/agentRunner.js:420`: `paymasterReceipt.txHash = receipt.hash;` (real on-chain receipt from `approveAndExecuteEscalatedPayout`).

### Code Observation & Impact
- In `ledger/receipts.json` and `euthyna.beancount`, simulated random 64-hex strings and real on-chain transaction hashes both occupy the identical `txHash` / `meta-tx-hash` field with no distinguishing marker or status enum.
- Consumers (such as frontend audits or blockchain explorers) cannot determine whether an entry represents an actual Arc L1 on-chain transaction or a simulated local mock.

### Recommended Remedy
- Add an explicit field such as `txKind: "onchain" | "simulated"` or `executionMode: "LIVE_CHAIN" | "MOCK_PAYMASTER"` to `AgentExecutionReceipt` in `euthynaAudit.js`.

---

## 6. ARCHITECTURE: Canonical Entry Identifiers & Structured Slabs Endpoint

### Location
- `server.js:223` (`GET /api/audit/beancount`)
- `ledger/receipts.json`

### Code Observation
- Neither `ledger/receipts.json` nor `ledger/euthyna.beancount` assigns canonical sequential identifiers (e.g. `"EUTHYNA #00481"`).
- `/api/audit/beancount` returns raw double-entry accounting plain text (`text/plain`), requiring complex text parsing in the client.

### Recommended Remedy
- Provide a dedicated structured endpoint, such as `GET /api/audit/slabs`, returning a normalized JSON array with canonical entry indices, on-chain verification flags, and formatted metadata.
