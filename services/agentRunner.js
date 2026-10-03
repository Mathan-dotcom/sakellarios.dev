/**
 * Vestiarion AI - Autonomous Treasury Operator & AP/AR Agent Core
 * Implements PRD Section 5, 8, 9, 10:
 * Complete orchestrator coordinating Cash Flow Forecasting, OpenSanctions screening,
 * Yield Sweeping, JIT USYC Liquidity Redemption, Policy Contract execution/escalation,
 * Circle Paymaster gasless payouts, and Euthyna Beancount / JSON-LD audit generation.
 */

const { ethers } = require('ethers');
const { CashFlowForecaster } = require('./forecaster');
const { OpenSanctionsVerifier } = require('./sanctions');
const { EuthynaAuditLedger } = require('./euthynaAudit');
const { CircleStackService } = require('./circleStack');
const { SupervisorNotifier } = require('./supervisorNotifier');

class VestiarionAgent {
    constructor(config = {}) {
        this.forecaster = new CashFlowForecaster();
        this.sanctionsVerifier = new OpenSanctionsVerifier();
        this.auditLedger = new EuthynaAuditLedger();
        this.circleStack = new CircleStackService(config);
        this.notifier = new SupervisorNotifier();

        // Operational State (synced with PolicyWallet on-chain model)
        this.walletAddress = ethers.getAddress((config.walletAddress || "0x9A48F7d6E5B4e91823B58485AcFe7B08E9D02195").toLowerCase());
        this.agentAddress = ethers.getAddress((config.agentAddress || "0x2222222222222222222222222222222222222222").toLowerCase());
        this.ownerAddress = ethers.getAddress((config.ownerAddress || "0x1111111111111111111111111111111111111111").toLowerCase());
        
        // Locked Policy Parameters (PRD Section 2)
        this.dailyLimit = 1000.00;
        this.maxSingleTx = 250.00;
        this.spentToday = 0.00;
        this.escalationNonce = 0;
        
        // Category Limits
        this.categoryLimits = {
            "INFRASTRUCTURE": 500.00,
            "PAYROLL": 800.00,
            "SAAS": 300.00,
            "VENDOR": 400.00
        };
        this.categorySpentToday = {
            "INFRASTRUCTURE": 0.00,
            "PAYROLL": 0.00,
            "SAAS": 0.00,
            "VENDOR": 0.00
        };

        // Whitelisted vendors
        this.whitelistedVendors = new Map([
            ["0x3333333333333333333333333333333333333333", { name: "Cloudflare & AWS Cloud Ops", category: "INFRASTRUCTURE" }],
            ["0x4444444444444444444444444444444444444444", { name: "Internal Dev Core Contributor", category: "PAYROLL" }],
            ["0x6666666666666666666666666666666666666666", { name: "External Partner Alpha (OS Bounty)", category: "VENDOR" }],
            ["0x7777777777777777777777777777777777777777", { name: "Anthropic API & Claude Token Credits", category: "SAAS" }]
        ]);

        // Balances on Arc L1
        this.liquidUsdcBalance = 10000.00;
        this.usycVaultBalance = 25000.00;

        // Pending Escalations Map
        this.pendingTransactions = new Map();

        // Invoices repository
        this.processedInvoices = [];
    }

    /**
     * Get real-time summary of treasury health, policies, and reserves
     */
    async getTreasurySummary() {
        const forecast = this.forecaster.calculateTargetBuffer();
        const sweepEval = this.forecaster.evaluateYieldSweep(this.liquidUsdcBalance);
        const multichain = await this.circleStack.getMultichainReserves(this.walletAddress);

        return {
            policyWallet: {
                address: this.walletAddress,
                agentAddress: this.agentAddress,
                ownerAddress: this.ownerAddress,
                dailyLimit: this.dailyLimit,
                maxSingleTx: this.maxSingleTx,
                spentToday: this.spentToday,
                dailyLimitRemaining: Math.max(0, this.dailyLimit - this.spentToday),
                categoryLimits: this.categoryLimits,
                categorySpentToday: this.categorySpentToday,
                escalationNonce: this.escalationNonce
            },
            balances: {
                arcLiquidUsdc: this.liquidUsdcBalance,
                arcUsycVault: this.usycVaultBalance,
                totalArcCapital: this.liquidUsdcBalance + this.usycVaultBalance,
                multichainReserves: multichain
            },
            cashFlowForecasting: {
                targetBuffer30D: forecast.targetBuffer,
                fixedExpensesSum: forecast.sumFixed,
                variableAPSum: forecast.sumVariable,
                yieldSweepStatus: sweepEval
            },
            pendingEscalationsCount: Array.from(this.pendingTransactions.values()).filter(t => !t.executed && !t.cancelled).length
        };
    }

    /**
     * Process an incoming invoice through the entire autonomous decision pipeline
     */
    async processIncomingInvoice({
        vendorAddress,
        amountUsdc,
        category,
        invoiceRef,
        reasoning = ""
    }) {
        const cat = (category || "VENDOR").toUpperCase();
        console.log(`\n[Vestiarion Agent] Processing Invoice #${invoiceRef} for ${amountUsdc} USDC to ${vendorAddress} [${cat}]`);

        // STEP 1: Live OpenSanctions Screening
        const sanctionsResult = await this.sanctionsVerifier.screenRecipient(vendorAddress);
        if (!sanctionsResult.isClean) {
            const error = `REJECTED: Recipient ${vendorAddress} flagged by OpenSanctions API! Transaction blocked.`;
            console.error(`[Vestiarion Agent] ${error}`);
            return {
                success: false,
                status: "SANCTIONS_BLOCKED",
                error,
                sanctionsResult
            };
        }

        // STEP 2: Whitelist verification
        if (!this.whitelistedVendors.has(vendorAddress.toLowerCase())) {
            const error = `REVERT: Vendor ${vendorAddress} not whitelisted in PolicyWallet.sol`;
            console.error(`[Vestiarion Agent] ${error}`);
            return {
                success: false,
                status: "WHITELIST_REJECTED",
                error
            };
        }

        // STEP 3: JIT Liquidity Check (Redeem USYC if liquid USDC is insufficient)
        let redeemedFromUsyc = false;
        let redeemedAmount = 0;
        if (this.liquidUsdcBalance < amountUsdc) {
            const deficit = amountUsdc - this.liquidUsdcBalance;
            if (this.usycVaultBalance < deficit) {
                return {
                    success: false,
                    status: "INSUFFICIENT_FUNDS",
                    error: `Total treasury capital (${this.liquidUsdcBalance + this.usycVaultBalance} USDC) insufficient for invoice (${amountUsdc} USDC)`
                };
            }
            // Execute JIT redemption
            this.usycVaultBalance -= deficit;
            this.liquidUsdcBalance += deficit;
            redeemedFromUsyc = true;
            redeemedAmount = deficit;
            
            const redeemTxHash = "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join("");
            this.auditLedger.recordYieldRedemption({
                txHash: redeemTxHash,
                agentId: this.agentAddress,
                amountUsdc: deficit,
                purpose: `JIT Settlement for Invoice #${invoiceRef}`
            });
            console.log(`[Vestiarion Agent] JIT: Redeemed ${deficit} USDC from USYC to fulfill payout.`);
        }

        // STEP 4: Smart Contract Policy Verification
        const exceedsSingleTx = amountUsdc > this.maxSingleTx;
        const exceedsGlobalDaily = (this.spentToday + amountUsdc) > this.dailyLimit;
        const currentCategorySpent = this.categorySpentToday[cat] || 0;
        const categoryLimit = this.categoryLimits[cat] || 500;
        const exceedsCategoryLimit = (currentCategorySpent + amountUsdc) > categoryLimit;

        // Path A: Over-limit -> Escalation Queue (Agent-Proposed, Owner-Approved)
        if (exceedsSingleTx || exceedsGlobalDaily || exceedsCategoryLimit) {
            this.escalationNonce++;
            const reasoningHash = ethers.keccak256(ethers.toUtf8Bytes(reasoning || `Invoice ${invoiceRef} exceeds limit threshold`));
            
            // Generate deterministic txId matching Solidity abi.encodePacked
            const checksummedVendor = ethers.getAddress(vendorAddress.toLowerCase());
            const txId = ethers.keccak256(
                ethers.solidityPacked(
                    ["address", "uint256", "bytes32", "string", "uint256", "address"],
                    [checksummedVendor, Math.floor(amountUsdc * 1e6), ethers.keccak256(ethers.toUtf8Bytes(cat)), invoiceRef, this.escalationNonce, this.walletAddress]
                )
            );

            const pendingTx = {
                txId,
                vendor: vendorAddress,
                amount: amountUsdc,
                category: cat,
                invoiceRef,
                reasoningHash,
                reasoning: reasoning || "Invoice amount exceeds standard agent spending threshold.",
                createdAt: Math.floor(Date.now() / 1000),
                agentApproved: true,
                ownerApproved: false,
                executed: false,
                cancelled: false,
                requiresSupervisorReason: exceedsSingleTx 
                    ? `Exceeds max single tx threshold (${this.maxSingleTx} USDC)` 
                    : exceedsCategoryLimit 
                        ? `Breaches category daily limit (${categoryLimit} USDC)` 
                        : `Breaches global daily limit (${this.dailyLimit} USDC)`
            };

            this.pendingTransactions.set(txId, pendingTx);

            // Alert Supervisor
            await this.notifier.notifyEscalation({
                txId,
                vendor: vendorAddress,
                amountUsdc,
                category: cat,
                invoiceRef,
                reasoning: pendingTx.requiresSupervisorReason
            });

            console.log(`[Vestiarion Agent] Escalated Payout Created: ${txId} (${pendingTx.requiresSupervisorReason})`);

            return {
                success: true,
                status: "ESCALATED_PENDING_APPROVAL",
                escalation: pendingTx,
                sanctionsResult,
                message: `Invoice #${invoiceRef} submitted to on-chain pending approval queue. Supervisor alert sent.`
            };
        }

        // Path B: Standard Direct Payout (<= 250 USDC, within budget)
        // Execute through Circle Paymaster
        const paymasterReceipt = await this.circleStack.sponsorAndExecutePayout({
            walletAddress: this.walletAddress,
            vendorAddress,
            amountUsdc,
            category: cat,
            invoiceRef
        });

        // Update on-chain state counters
        this.spentToday += amountUsdc;
        this.categorySpentToday[cat] = (this.categorySpentToday[cat] || 0) + amountUsdc;
        this.liquidUsdcBalance -= amountUsdc;

        // Record in Euthyna Ledger (Beancount + JSON-LD)
        const auditLog = this.auditLedger.recordPayoutExecution({
            txHash: paymasterReceipt.txHash,
            agentId: this.agentAddress,
            policyAddress: this.walletAddress,
            vendorAddress,
            amountUsdc,
            category: cat,
            invoiceRef,
            dailyLimitRemaining: this.dailyLimit - this.spentToday,
            sanctionsResult,
            redeemedFromUsyc,
            liquidUsdcAvailable: this.liquidUsdcBalance,
            escalationNonce: this.escalationNonce
        });

        const invoiceRecord = {
            invoiceRef,
            vendor: vendorAddress,
            amount: amountUsdc,
            category: cat,
            status: "PAID",
            paymasterSponsored: true,
            txHash: paymasterReceipt.txHash,
            settledAt: new Date().toISOString()
        };
        this.processedInvoices.push(invoiceRecord);

        console.log(`[Vestiarion Agent] Settled Payout gaslessly via Circle Paymaster! TxHash: ${paymasterReceipt.txHash}`);

        return {
            success: true,
            status: "PAID",
            txHash: paymasterReceipt.txHash,
            paymasterReceipt,
            auditLog,
            invoice: invoiceRecord
        };
    }

    /**
     * Supervisor / Owner Approves and Executes Escalated Payout
     * PRD Section 6: Intentionally overrides category limit while strictly respecting global dailyLimit
     */
    async approveEscalatedPayout(txId, callerAddress = this.ownerAddress) {
        if (callerAddress.toLowerCase() !== this.ownerAddress.toLowerCase()) {
            throw new Error(`Caller is not owner. OwnableUnauthorizedAccount(${callerAddress})`);
        }

        const pTx = this.pendingTransactions.get(txId);
        if (!pTx) throw new Error("Transaction not found");
        if (pTx.executed) throw new Error("Transaction already executed");
        if (pTx.cancelled) throw new Error("Transaction has been cancelled");

        const now = Math.floor(Date.now() / 1000);
        if (now > pTx.createdAt + (3 * 86400)) {
            throw new Error("Escalated transaction expired");
        }

        if (this.spentToday + pTx.amount > this.dailyLimit) {
            throw new Error("Breaches global daily limit");
        }

        // Execute payment via Paymaster
        const paymasterReceipt = await this.circleStack.sponsorAndExecutePayout({
            walletAddress: this.walletAddress,
            vendorAddress: pTx.vendor,
            amountUsdc: pTx.amount,
            category: pTx.category,
            invoiceRef: pTx.invoiceRef
        });

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
    }

    /**
     * Cancel an escalated payout
     */
    async cancelEscalatedPayout(txId, callerAddress = this.agentAddress) {
        const isAuthorized = callerAddress.toLowerCase() === this.ownerAddress.toLowerCase() ||
                             callerAddress.toLowerCase() === this.agentAddress.toLowerCase();
        if (!isAuthorized) {
            throw new Error("Unauthorized to cancel");
        }

        const pTx = this.pendingTransactions.get(txId);
        if (!pTx) throw new Error("Transaction not found");
        if (pTx.executed) throw new Error("Cannot cancel executed transaction");
        if (pTx.cancelled) throw new Error("Transaction already cancelled");

        pTx.cancelled = true;
        return {
            success: true,
            status: "CANCELLED",
            txId
        };
    }

    /**
     * Trigger autonomous yield sweep
     */
    async sweepSurplusYield() {
        const sweepEval = this.forecaster.evaluateYieldSweep(this.liquidUsdcBalance);
        if (!sweepEval.shouldSweep) {
            return {
                swept: false,
                reason: sweepEval.reason
            };
        }

        const amountToSweep = sweepEval.surplusAmount;
        this.liquidUsdcBalance -= amountToSweep;
        this.usycVaultBalance += amountToSweep;

        const txHash = "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join("");
        const auditLog = this.auditLedger.recordYieldSweep({
            txHash,
            agentId: this.agentAddress,
            amountUsdc: amountToSweep,
            liquidBalanceAfter: this.liquidUsdcBalance
        });

        return {
            swept: true,
            amountSwept: amountToSweep,
            txHash,
            liquidUsdcBalance: this.liquidUsdcBalance,
            usycVaultBalance: this.usycVaultBalance,
            auditLog
        };
    }

    /**
     * Redeem from USYC
     */
    async redeemUsyc(amount) {
        if (this.usycVaultBalance < amount) {
            throw new Error("Insufficient USYC vault balance");
        }

        this.usycVaultBalance -= amount;
        this.liquidUsdcBalance += amount;

        const txHash = "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join("");
        const auditLog = this.auditLedger.recordYieldRedemption({
            txHash,
            agentId: this.agentAddress,
            amountUsdc: amount,
            purpose: "Manual / Operator Yield Redemption"
        });

        return {
            redeemed: true,
            amountRedeemed: amount,
            txHash,
            liquidUsdcBalance: this.liquidUsdcBalance,
            usycVaultBalance: this.usycVaultBalance,
            auditLog
        };
    }
}

module.exports = { VestiarionAgent };
