/**
 * Vestiarion AI — Supervisor Escalation Queue
 * Displays pending over-limit transactions with 1-click human supervisor approvals & cancellations.
 */

class EscalationQueue {
  constructor(dashboardInstance) {
    this.dashboard = dashboardInstance;
    this.escalations = [];
  }

  async refresh() {
    try {
      const res = await fetch('/api/escalations');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        this.escalations = json.data.filter(t => !t.executed && !t.cancelled);
        this.render();
      }
    } catch (err) {
      console.warn('[Vestiarion AI] Escalations fetch warning:', err.message);
    }
  }

  async approveTx(txId) {
    if (window.brutalAudio) window.brutalAudio.stampThud();
    try {
      const res = await fetch(`/api/escalations/${txId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const json = await res.json();

      if (json.success) {
        alert(`Escalated Payout Approved & Executed!\nTxHash: ${json.data.txHash}`);
      } else {
        alert(`Approval Error: ${json.error}`);
      }

      await this.refresh();
      await this.dashboard.refresh();
    } catch (err) {
      alert(`Approval Failed: ${err.message}`);
    }
  }

  async cancelTx(txId) {
    if (window.brutalAudio) window.brutalAudio.alarm();
    try {
      const res = await fetch(`/api/escalations/${txId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const json = await res.json();

      if (json.success) {
        alert(`Escalated Transaction Cancelled.`);
      } else {
        alert(`Cancel Error: ${json.error}`);
      }

      await this.refresh();
      await this.dashboard.refresh();
    } catch (err) {
      alert(`Cancel Failed: ${err.message}`);
    }
  }

  render() {
    const container = document.getElementById('escalationsContainer');
    if (!container) return;

    if (this.escalations.length === 0) {
      container.innerHTML = `
        <div style="padding: 2.5rem; text-align: center; border: 2px dashed var(--ink-hard); background: var(--concrete-dark); font-family: var(--font-mono); color: var(--ink-soft);">
          [NO PENDING ESCALATIONS IN QUEUE — ALL TRANSACTIONS WITHSTAND POLICY LIMITS]
        </div>
      `;
      return;
    }

    container.innerHTML = this.escalations.map(tx => {
      const timestampMs = tx.createdAt ? (tx.createdAt > 1e11 ? tx.createdAt : tx.createdAt * 1000) : Date.now();
      const createdTime = new Date(timestampMs).toLocaleTimeString();
      const amountVal = tx.amount !== undefined ? tx.amount : (tx.amountUsdc !== undefined ? tx.amountUsdc : 0);
      const amountStr = Number(amountVal).toFixed(2);
      const txId = tx.id || tx.txId;
      const vendor = tx.vendor || tx.vendorAddress || '0x3333333333333333333333333333333333333333';
      const vendorTrunc = vendor.length >= 42 ? vendor.substring(0, 10) + '...' + vendor.substring(34) : vendor;

      return `
        <div class="escalation-card">
          <div class="escalation-card-header">
            <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
              <span class="sak-seal sak-seal--warning">FOLIO TX #${tx.escalationNonce || 1}</span>
              <span style="font-family: var(--font-serif); font-size: 1.05rem; color: var(--ink); font-weight: 500;">${tx.invoiceRef || 'INV-PENDING'}</span>
              <span class="sak-seal" style="font-size: 0.65rem;">${tx.category || 'VENDOR'}</span>
            </div>
            <span class="sak-seal sak-seal--warning">SEAL OVERRIDE REQUIRED</span>
          </div>

          <div class="escalation-meta-grid">
            <div>
              <span style="color: var(--ink-faint); display: block; font-size: 0.68rem; font-family: var(--font-mono); text-transform: uppercase;">AMOUNT (USDC):</span>
              <strong style="font-size: 1.25rem; color: var(--gold-leaf); font-family: var(--font-serif);">$${amountStr}</strong>
            </div>
            <div>
              <span style="color: var(--ink-faint); display: block; font-size: 0.68rem; font-family: var(--font-mono); text-transform: uppercase;">VENDOR SINK:</span>
              <code style="font-size: 0.78rem; font-family: var(--font-mono); color: var(--ink);">${vendorTrunc}</code>
            </div>
            <div>
              <span style="color: var(--ink-faint); display: block; font-size: 0.68rem; font-family: var(--font-mono); text-transform: uppercase;">SUBMITTED AT:</span>
              <span style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--ink-secondary);">${createdTime}</span>
            </div>
            <div>
              <span style="color: var(--ink-faint); display: block; font-size: 0.68rem; font-family: var(--font-mono); text-transform: uppercase;">TIMELOCK EXPIRY:</span>
              <span style="color: var(--verdigris); font-weight: 600; font-family: var(--font-mono); font-size: 0.78rem;">3 DAYS (GUARANTEED)</span>
            </div>
          </div>

          <div class="escalation-reason-box">
            <strong style="color: var(--gold-leaf); font-family: var(--font-mono); font-size: 0.7rem;">CHANCERY REASONING:</strong> ${tx.reasoning || tx.requiresSupervisorReason || 'Transaction exceeds 250 USDC single tx ceiling.'}
          </div>

          <div class="escalation-actions-row">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span class="chancery-dot chancery-dot--gold"></span>
              <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--ink-secondary);">GUARDRAIL STATE: <strong>AWAITING SOVEREIGN SEAL</strong></span>
            </div>
            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
              <button class="sak-btn sak-btn--settled bru-button-sm" onclick="window.escalationQueueInstance.approveTx('${txId}')">
                SEAL &amp; EXECUTE ON-CHAIN
              </button>
              <button class="sak-btn sak-btn--danger bru-button-sm" onclick="window.escalationQueueInstance.cancelTx('${txId}')">
                CANCEL TRANSACTION
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
}

window.EscalationQueue = EscalationQueue;
