/**
 * Vestiarion AI - Batch Invoice Ingestion Script
 * Simulates incoming accounts payable bills from Cloud infrastructure, SaaS APIs,
 * core team payroll, and external open-source contributors.
 */

const { VestiarionAgent } = require("../services/agentRunner");

async function seed() {
    const agent = new VestiarionAgent();

    console.log("Ingesting test bills into Vestiarion AI pipeline...\n");

    const bills = [
        {
            vendorAddress: "0x3333333333333333333333333333333333333333",
            amountUsdc: 85.00,
            category: "INFRASTRUCTURE",
            invoiceRef: "INV-AWS-3902",
            reasoning: "Monthly load balancer & egress data transfer"
        },
        {
            vendorAddress: "0x7777777777777777777777777777777777777777",
            amountUsdc: 150.00,
            category: "SAAS",
            invoiceRef: "INV-ANTHROPIC-482",
            reasoning: "Claude 3.7 Sonnet API inference usage for treasury forecasting"
        },
        {
            vendorAddress: "0x6666666666666666666666666666666666666666",
            amountUsdc: 350.00,
            category: "VENDOR",
            invoiceRef: "INV-BOUNTY-088",
            reasoning: "Audited Circom ZK Verifier milestone payout (Requires escalation approval)"
        }
    ];

    for (const bill of bills) {
        console.log(`Processing invoice ${bill.invoiceRef} (${bill.amountUsdc} USDC)...`);
        const res = await agent.processIncomingInvoice(bill);
        console.log(`Result: ${res.status}\n`);
    }

    console.log("All sample bills processed through autonomous pipeline.");
}

seed().catch(console.error);
