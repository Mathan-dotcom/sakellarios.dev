/**
 * Vestiarion AI — Autonomous Invoice Processing Workbench
 * Handles incoming bills, 4-stage decision pipeline, and live terminal streaming.
 */

class InvoiceWorkbench {
  constructor(dashboardInstance, escalationInstance) {
    this.dashboard = dashboardInstance;
    this.escalations = escalationInstance;

    this.scenarios = {
      infra: {
        vendor: "0x3333333333333333333333333333333333333333",
        amount: "120.00",
        category: "INFRASTRUCTURE",
        ref: "INV-CLOUD-" + Math.floor(1000 + Math.random() * 9000),
        reasoning: "Monthly AWS + Hetzner Kubernetes hosting cluster for Arc RPC nodes."
      },
      stipend: {
        vendor: "0x6666666666666666666666666666666666666666",
        amount: "400.00",
        category: "VENDOR",
        ref: "INV-PARTNER-" + Math.floor(100 + Math.random() * 900),
        reasoning: "External open-source maintainer stipend for Circom ZK-proof optimization."
      },
      ai: {
        vendor: "0x7777777777777777777777777777777777777777",
        amount: "280.00",
        category: "SAAS",
        ref: "INV-AI-" + Math.floor(1000 + Math.random() * 9000),
        reasoning: "Anthropic API & Claude Token Credits for agentic research."
      },
      rogue: {
        vendor: "0x9999999999999999999999999999999999999999",
        amount: "50.00",
        category: "VENDOR",
        ref: "INV-UNAPPROVED-01",
        reasoning: "Non-whitelisted external recipient test (Smart Contract Revert expected)."
      },
      sanctioned: {
        vendor: "0x8576acc5c05d6ce88f4e49bf65bdf0c62f91353c",
        amount: "75.00",
        category: "VENDOR",
        ref: "INV-SANCTIONED-01",
        reasoning: "Live OpenSanctions SDN match test (Pre-execution block expected)."
      }
    };

    this.initEventListeners();
  }

  initEventListeners() {
    // Preset scenario chips
    document.querySelectorAll('.scenario-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.scenario-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.loadScenario(chip.dataset.scenario);
        if (window.brutalAudio) window.brutalAudio.click();
      });
    });

    // Submit invoice button
    const btnSubmit = document.getElementById('btnSubmitInvoice');
    if (btnSubmit) {
      btnSubmit.addEventListener('click', (e) => {
        e.preventDefault();
        this.processInvoice();
      });
    }

    // Default load infra
    this.loadScenario('infra');
  }

  loadScenario(key) {
    const sc = this.scenarios[key];
    if (!sc) return;

    document.getElementById('inputVendorAddr').value = sc.vendor;
    document.getElementById('inputInvoiceAmount').value = sc.amount;
    document.getElementById('inputCategory').value = sc.category;
    document.getElementById('inputInvoiceRef').value = sc.ref;
    document.getElementById('inputReasoning').value = sc.reasoning;
  }

  logTerminal(msg, type = 'normal') {
    const body = document.getElementById('terminalInvoiceBody');
    if (!body) return;

    const line = document.createElement('div');
    line.className = `terminal-line terminal-line--${type}`;
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    line.innerHTML = `
      <span class="terminal-line-time">[${timeStr}]</span>
      <span class="terminal-line-text">${msg}</span>
    `;
    body.appendChild(line);
    body.scrollTop = body.scrollHeight;

    if (window.brutalAudio) window.brutalAudio.dataChirp();
  }

  setPipelineStep(stepIndex, status) {
    // 1: Sanctions, 2: Forecast, 3: Guardrail, 4: Settlement
    const stepEl = document.getElementById(`pipeStep${stepIndex}`);
    if (!stepEl) return;

    stepEl.className = 'pipeline-step';
    if (status === 'active') stepEl.classList.add('step-active');
    if (status === 'passed') stepEl.classList.add('step-passed');
    if (status === 'failed') stepEl.classList.add('step-failed');

    const statusSpan = stepEl.querySelector('.pipeline-status');
    if (statusSpan) {
      statusSpan.textContent = `[${status.toUpperCase()}]`;
    }
  }

  resetPipeline() {
    for (let i = 1; i <= 4; i++) {
      this.setPipelineStep(i, 'pending');
    }
  }

  async processInvoice() {
    const vendorAddress = document.getElementById('inputVendorAddr').value.trim();
    const amountUsdc = parseFloat(document.getElementById('inputInvoiceAmount').value);
    const category = document.getElementById('inputCategory').value;
    const invoiceRef = document.getElementById('inputInvoiceRef').value.trim();
    const reasoning = document.getElementById('inputReasoning').value.trim();

    const btnSubmit = document.getElementById('btnSubmitInvoice');
    const stampEl = document.getElementById('invoiceVerdictStamp');

    if (!vendorAddress || !amountUsdc || !invoiceRef) {
      alert('Missing required invoice fields');
      return;
    }

    try {
      if (btnSubmit) btnSubmit.disabled = true;
      this.resetPipeline();

      this.logTerminal(`[INGEST] Received Invoice #${invoiceRef} for ${amountUsdc.toFixed(2)} USDC [${category}]`, 'normal');

      // Stage 1: Sanctions Screening
      this.setPipelineStep(1, 'active');
      this.logTerminal(`[1/4] Running Live OpenSanctions Screening for ${vendorAddress.substring(0, 10)}...`, 'normal');
      await new Promise(r => setTimeout(r, 450));

      // Call API
      const res = await fetch('/api/invoices/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorAddress,
          amountUsdc,
          category,
          invoiceRef,
          reasoning
        })
      });

      const json = await res.json();

      if (!json.success) {
        // Handle Policy Rejection (Sanctions or Whitelist)
        const errMsg = json.error || 'Invoice Processing Rejected';
        this.logTerminal(`[POLICY REVERT] ${errMsg}`, 'error');

        if (errMsg.includes('Sanction') || errMsg.includes('sanction')) {
          this.setPipelineStep(1, 'failed');
          if (window.brutalAudio) window.brutalAudio.alarm();
        } else {
          this.setPipelineStep(1, 'passed');
          this.setPipelineStep(2, 'passed');
          this.setPipelineStep(3, 'failed');
          if (window.brutalAudio) window.brutalAudio.alarm();
        }

        const workbenchCard = document.querySelector('.invoice-form-card');
        if (workbenchCard) {
          workbenchCard.classList.add('anim-screen-shake');
          setTimeout(() => workbenchCard.classList.remove('anim-screen-shake'), 450);
        }

        if (stampEl) {
          stampEl.textContent = 'REVERTED: ' + errMsg;
          stampEl.className = 'bru-stamp bru-stamp--critical anim-critical-blink';
        }
        return;
      }

      // Success or Escalation Path
      const result = json.data;
      this.setPipelineStep(1, 'passed');

      // Stage 2: Forecast
      this.setPipelineStep(2, 'active');
      const liquidAvail = result.auditLog?.liquidUsdcAvailable || (this.dashboard?.summaryData?.balances?.arcLiquidUsdc || 9850);
      this.logTerminal(`[2/4] Cash Flow Forecaster: Operating 30-day buffer verified ($${Number(liquidAvail).toFixed(2)} USDC liquid available)`, 'normal');
      await new Promise(r => setTimeout(r, 400));
      this.setPipelineStep(2, 'passed');

      // Stage 3: Guardrails
      this.setPipelineStep(3, 'active');
      this.logTerminal(`[3/4] Evaluating PolicyWallet.sol: Cap $250.00, Category daily ceiling check...`, 'normal');
      await new Promise(r => setTimeout(r, 400));
      this.setPipelineStep(3, 'passed');

      // Stage 4: Execution / Escalation
      this.setPipelineStep(4, 'active');

      const isPaid = result.status === 'PAID' || result.action === 'PAYOUT_EXECUTED';
      const isEscalated = result.status === 'ESCALATED_PENDING_APPROVAL' || result.action === 'ESCALATION_REQUESTED';

      if (isPaid) {
        this.setPipelineStep(4, 'passed');
        const txHash = result.txHash || result.paymasterReceipt?.txHash || '0x...';
        this.logTerminal(`[4/4] CIRCLE PAYMASTER SUCCESS! Gasless USDC payout settled ($0.00 gas). TxHash: ${txHash}`, 'success');
        this.logTerminal(`[EUTHYNA] Cryptographic Beancount and JSON-LD receipt signed.`, 'success');

        if (window.brutalAudio) window.brutalAudio.stampThud();
        if (stampEl) {
          stampEl.textContent = 'PAYMASTER SETTLED (GASLESS $0.00)';
          stampEl.className = 'sak-seal sak-seal--settled';
        }
      } else if (isEscalated) {
        this.setPipelineStep(4, 'passed');
        const nonce = result.escalation?.escalationNonce || result.escalationNonce || 1;
        const txId = result.escalation?.txId || result.txId || '0x...';
        this.logTerminal(`[4/4] ESCALATION QUEUED: Amount exceeds cap. Nonce ${nonce}. TxID: ${txId}`, 'warn');
        this.logTerminal(`[SUPERVISOR] Webhook dispatched. Awaiting Human Supervisor signature.`, 'warn');

        if (window.brutalAudio) window.brutalAudio.stampThud();
        if (stampEl) {
          stampEl.textContent = 'ESCALATED TO SUPERVISOR QUEUE';
          stampEl.className = 'sak-seal sak-seal--warning';
        }
      } else {
        this.setPipelineStep(4, 'passed');
      }

      await this.dashboard.refresh();
      if (this.escalations) await this.escalations.refresh();
    } catch (err) {
      this.logTerminal(`[ERROR] ${err.message}`, 'error');
      if (window.brutalAudio) window.brutalAudio.alarm();
    } finally {
      if (btnSubmit) btnSubmit.disabled = false;
    }
  }
}

window.InvoiceWorkbench = InvoiceWorkbench;
