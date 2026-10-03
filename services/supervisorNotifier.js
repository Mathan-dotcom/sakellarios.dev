/**
 * Vestiarion AI - Supervisor Escalation Alert & Notification Webhook
 * Implements PRD Section 5.2, 9, 10.1:
 * Dispatches real-time webhooks (Telegram / HTTP endpoint) when an over-limit
 * or over-budget transaction is placed in the on-chain escalation queue.
 */

class SupervisorNotifier {
    constructor(webhookUrl = process.env.SUPERVISOR_WEBHOOK_URL || "") {
        this.webhookUrl = webhookUrl;
        this.notificationHistory = [];
    }

    /**
     * Dispatch an urgent notification for pending human supervisor approval
     */
    async notifyEscalation({
        txId,
        vendor,
        amountUsdc,
        category,
        invoiceRef,
        reasoning,
        createdAt
    }) {
        const payload = {
            title: "🚨 Vestiarion AI: Supervisor Action Required",
            timestamp: new Date().toISOString(),
            escalationId: txId,
            vendor,
            amount: `${amountUsdc} USDC`,
            category,
            invoiceReference: invoiceRef,
            reasoning,
            instructions: "This payout exceeds the automated 250 USDC threshold or category cap. Review and sign on-chain via approveAndExecuteEscalatedPayout(txId). Request expires in 72 hours."
        };

        this.notificationHistory.push(payload);
        console.log(`[Supervisor Notification] Escalate Alert: ${payload.amount} to ${payload.vendor} (Invoice: ${invoiceRef})`);

        if (this.webhookUrl) {
            try {
                await fetch(this.webhookUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                    signal: AbortSignal.timeout(3000)
                });
            } catch (err) {
                console.warn(`[SupervisorNotifier] Webhook push failed: ${err.message}`);
            }
        }

        return payload;
    }

    getHistory() {
        return this.notificationHistory;
    }
}

module.exports = { SupervisorNotifier };
