/**
 * Vestiarion AI - Autonomous Treasury Backend Server
 * Production API serving the frontend with live on-chain guardrails,
 * Circle Gateway, Circle Paymaster, OpenSanctions, and Euthyna Beancount ledger.
 */

const express = require('express');
const cors = require('cors');
const { VestiarionAgent } = require('./services/agentRunner');

const path = require('path');
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Serve Flagship 3D Codex UI (frontend.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend.html'));
});

app.get('/frontend', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend.html'));
});

app.get('/codex', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend.html'));
});

app.get('/landing', (req, res) => {
    res.sendFile(path.join(__dirname, 'landing.html'));
});

// Serve 3D Supernova Integrated Scrollytelling Experience
app.get('/supernova', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Initialize the Autonomous Treasury Agent
const agent = new VestiarionAgent();

// ----------------------------------------------------
// Day-1 Traction Seed Data (PRD Section 11)
// ----------------------------------------------------
async function seedInitialState() {
    console.log("[Vestiarion AI] Initializing Day-1 Traction Seed Operations...");
    
    // User #1 (Internal Builder Team): Cloud server bill (120 USDC - Standard Payout via Paymaster)
    await agent.processIncomingInvoice({
        vendorAddress: "0x3333333333333333333333333333333333333333",
        amountUsdc: 120.00,
        category: "INFRASTRUCTURE",
        invoiceRef: "INV-CLOUD-8821",
        reasoning: "Monthly AWS + Hetzner Kubernetes hosting cluster for Arc RPC nodes."
    });

    // User #2 (External Alpha Partner): Contributor Stipend (400 USDC - Escalated Payout > 250 cap)
    await agent.processIncomingInvoice({
        vendorAddress: "0x6666666666666666666666666666666666666666",
        amountUsdc: 400.00,
        category: "VENDOR",
        invoiceRef: "INV-PARTNER-009",
        reasoning: "External open-source maintainer stipend for Circom ZK-proof optimization."
    });

    console.log("[Vestiarion AI] Seed operations complete. Ready for live operations.");
}

// ----------------------------------------------------
// API Routes
// ----------------------------------------------------

// 1. Treasury Summary & Health
app.get('/api/treasury/summary', async (req, res) => {
    try {
        const summary = await agent.getTreasurySummary();
        res.json({ success: true, data: summary });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. Multichain Reserves (Circle Gateway)
app.get('/api/treasury/gateway-reserves', async (req, res) => {
    try {
        const reserves = await agent.circleStack.getMultichainReserves(agent.walletAddress);
        res.json({ success: true, data: reserves });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. Autonomous Yield Sweep
app.post('/api/treasury/sweep', async (req, res) => {
    try {
        const result = await agent.sweepSurplusYield();
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 4. JIT Yield Redemption
app.post('/api/treasury/redeem', async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, error: "Valid amount required" });
        }
        const result = await agent.redeemUsyc(Number(amount));
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 5. Invoices List
app.get('/api/invoices', (req, res) => {
    res.json({
        success: true,
        data: {
            processed: agent.processedInvoices,
            pendingEscalation: Array.from(agent.pendingTransactions.values()).filter(t => !t.executed && !t.cancelled)
        }
    });
});

// 6. Process Incoming Invoice (Autonomous Agent Entry Point)
app.post('/api/invoices/process', async (req, res) => {
    try {
        const { vendorAddress, amountUsdc, category, invoiceRef, reasoning } = req.body;
        if (!vendorAddress || !amountUsdc || !invoiceRef) {
            return res.status(400).json({ success: false, error: "Missing required fields (vendorAddress, amountUsdc, invoiceRef)" });
        }

        const result = await agent.processIncomingInvoice({
            vendorAddress,
            amountUsdc: Number(amountUsdc),
            category,
            invoiceRef,
            reasoning
        });

        res.json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 7. Escalation Queue (Pending Human Supervisor Review)
app.get('/api/escalations', (req, res) => {
    const escalations = Array.from(agent.pendingTransactions.values());
    res.json({ success: true, data: escalations });
});

// 8. Approve & Execute Escalated Payout (Owner Action)
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

// 9. Cancel Escalated Payout (Agent or Owner Action)
app.post('/api/escalations/:id/cancel', async (req, res) => {
    try {
        const txId = req.params.id;
        const caller = req.body.callerAddress || agent.agentAddress;
        const result = await agent.cancelEscalatedPayout(txId, caller);
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// 10. Live OpenSanctions Screening Endpoint
app.post('/api/sanctions/check', async (req, res) => {
    try {
        const { addressOrEntity } = req.body;
        if (!addressOrEntity) {
            return res.status(400).json({ success: false, error: "addressOrEntity required" });
        }
        const result = await agent.sanctionsVerifier.screenRecipient(addressOrEntity);
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 11. Euthyna Ledger (Raw Beancount Format)
app.get('/api/audit/beancount', (req, res) => {
    try {
        const ledger = agent.auditLedger.getBeancountLedger();
        res.type('text/plain').send(ledger);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// 12. Euthyna JSON-LD Receipts
app.get('/api/audit/receipts', (req, res) => {
    try {
        const receipts = agent.auditLedger.getReceipts();
        res.json({ success: true, data: receipts });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Start Server
if (require.main === module) {
    seedInitialState().then(() => {
        app.listen(PORT, () => {
            console.log(`\n========================================================`);
            console.log(`🚀 Vestiarion AI Backend Server running on port ${PORT}`);
            console.log(`   Arc L1 Policy Wallet: ${agent.walletAddress}`);
            console.log(`   API endpoints available at http://localhost:${PORT}/api/`);
            console.log(`========================================================\n`);
        });
    });
}

module.exports = { app, agent };
