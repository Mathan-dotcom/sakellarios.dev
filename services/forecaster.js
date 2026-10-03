/**
 * Vestiarion AI - Cash Flow Forecaster & Operating Reserve Buffer Engine
 * Implements PRD Section 5.1:
 * Target Buffer = sum(Fixed Expenses 30D) + (1.2 * Variable AP 30D)
 * Sweeping Rule: if Liquid USDC > Target Buffer -> Sweep surplus to USYC
 * JIT Rule: if Liquid USDC < Required Payout -> Redeem deficit from USYC
 */

class CashFlowForecaster {
    constructor() {
        // Default recurring commitments (internal team + alpha partner)
        this.fixedExpenses = [
            { name: "Cloud Server Infrastructure (AWS/Hetzner)", monthlyAmount: 1800, category: "INFRASTRUCTURE", dueDay: 5 },
            { name: "Core Contributor Stipends / Payroll", monthlyAmount: 6000, category: "PAYROLL", dueDay: 1 },
            { name: "LLM Inference API Subsidy (Anthropic/OpenAI)", monthlyAmount: 700, category: "SAAS", dueDay: 15 }
        ];

        this.variableAP = [
            { name: "Security Audit Retainer", estimatedAmount: 1500, category: "VENDOR" },
            { name: "Open Source Contributor Bounty #218", estimatedAmount: 500, category: "VENDOR" }
        ];
    }

    /**
     * Compute the mathematical Target Operating Buffer for the next 30 days
     */
    calculateTargetBuffer() {
        const sumFixed = this.fixedExpenses.reduce((acc, item) => acc + item.monthlyAmount, 0);
        const sumVariable = this.variableAP.reduce((acc, item) => acc + item.estimatedAmount, 0);
        
        // PRD Equation: Target Buffer = sum(Fixed) + (1.2 * sum(Variable))
        const variableMultiplier = 1.2;
        const targetBuffer = sumFixed + (variableMultiplier * sumVariable);

        return {
            sumFixed,
            sumVariable,
            targetBuffer,
            breakdown: {
                fixed: this.fixedExpenses,
                variable: this.variableAP
            }
        };
    }

    /**
     * Evaluate if an automated yield sweep to USYC is indicated
     * @param {number} liquidUsdcBalance - current liquid USDC balance in wallet
     */
    evaluateYieldSweep(liquidUsdcBalance) {
        const { targetBuffer } = this.calculateTargetBuffer();
        if (liquidUsdcBalance > targetBuffer) {
            const surplus = liquidUsdcBalance - targetBuffer;
            return {
                shouldSweep: true,
                surplusAmount: surplus,
                targetBuffer,
                reason: `Liquid USDC (${liquidUsdcBalance}) exceeds 30-day operating buffer (${targetBuffer}). Auto-sweeping surplus to USYC Vault.`
            };
        }
        return {
            shouldSweep: false,
            surplusAmount: 0,
            targetBuffer,
            reason: `Liquid USDC (${liquidUsdcBalance}) is within or below safety buffer (${targetBuffer}). No sweep recommended.`
        };
    }

    /**
     * Evaluate JIT liquidity requirement for an upcoming payout
     * @param {number} liquidUsdcBalance - current liquid USDC balance
     * @param {number} requiredAmount - amount needed for the payout
     */
    evaluateJitLiquidity(liquidUsdcBalance, requiredAmount) {
        if (liquidUsdcBalance < requiredAmount) {
            const deficit = requiredAmount - liquidUsdcBalance;
            return {
                needsRedemption: true,
                deficitAmount: deficit,
                reason: `Liquid USDC (${liquidUsdcBalance}) is insufficient for payout of ${requiredAmount} USDC. Need to redeem ${deficit} USDC from USYC.`
            };
        }
        return {
            needsRedemption: false,
            deficitAmount: 0,
            reason: `Sufficient liquid USDC (${liquidUsdcBalance}) available for payout of ${requiredAmount} USDC.`
        };
    }
}

module.exports = { CashFlowForecaster };
