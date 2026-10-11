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

## 3. ARCHITECTURE: Structured Audit Endpoint for Slabs

### Location
- `server.js:223` (`GET /api/audit/beancount`)

### Code Observation
- `/api/audit/beancount` returns raw double-entry accounting plain text (`text/plain`).
- Parsing raw Beancount syntax in a browser client requires bundling a specialized text parser (or regex heuristics) to extract slab telemetry (folio numbers, debit/credit accounts, amounts, tags).

### Recommended Remedy
- Provide a dedicated structured endpoint, such as `GET /api/audit/slabs`, returning a normalized JSON array containing:
  - `folio`: e.g. `"EUTHYNA #00481"`
  - `txHash`: on-chain transaction hash
  - `amountUsdc`: formatted numeric amount
  - `category`: categorized expense account
  - `status`: `"PAID"` | `"HALTED"` | `"ESCALATED"`
  - `timestamp`: ISO-8601 UTC timestamp
  - `sponsor`: Circle Paymaster metadata
