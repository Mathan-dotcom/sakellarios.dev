/**
 * Vestiarion AI — USYC Yield Manager
 * Controls autonomous surplus yield sweeping and Just-In-Time (JIT) redemption.
 */

class YieldManager {
  constructor(dashboardInstance) {
    this.dashboard = dashboardInstance;
    this.initEventListeners();
  }

  initEventListeners() {
    const btnSweep = document.getElementById('btnSweepYield');
    const btnRedeem = document.getElementById('btnRedeemUsyc');
    const redeemInput = document.getElementById('redeemAmountInput');

    if (btnSweep) {
      btnSweep.addEventListener('click', () => this.handleSweep());
    }

    if (btnRedeem && redeemInput) {
      btnRedeem.addEventListener('click', () => {
        const val = parseFloat(redeemInput.value);
        if (!val || val <= 0) {
          alert('Please enter a valid USYC redemption amount');
          return;
        }
        this.handleRedeem(val);
      });
    }

    // Quick redemption preset buttons
    document.querySelectorAll('.redeem-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const amt = btn.dataset.amount;
        if (redeemInput) redeemInput.value = amt;
        if (window.brutalAudio) window.brutalAudio.click();
      });
    });
  }

  async handleSweep() {
    const statusEl = document.getElementById('yieldActionStatus');
    const btnSweep = document.getElementById('btnSweepYield');

    try {
      if (btnSweep) btnSweep.disabled = true;
      if (statusEl) {
        statusEl.textContent = 'EVALUATING SURPLUS VS 30-DAY OPERATING BUFFER...';
        statusEl.className = 'bru-stamp bru-stamp--warning';
      }
      if (window.brutalAudio) window.brutalAudio.dataChirp();

      const res = await fetch('/api/treasury/sweep', { method: 'POST' });
      const json = await res.json();

      if (json.success) {
        if (window.brutalAudio) window.brutalAudio.stampThud();
        if (statusEl) {
          if (json.data.action === 'SWEEP_EXECUTED') {
            statusEl.textContent = `SWEEP COMPLETE: ${json.data.amountSwept} USDC DEPOSITED INTO USYC VAULT`;
            statusEl.className = 'bru-stamp bru-stamp--success anim-recovery-stamp';
          } else {
            statusEl.textContent = `SWEEP EVALUATED: ${json.data.reason}`;
            statusEl.className = 'bru-stamp bru-stamp--inverted';
          }
        }
      } else {
        throw new Error(json.error || 'Sweep failed');
      }

      await this.dashboard.refresh();
    } catch (err) {
      if (window.brutalAudio) window.brutalAudio.alarm();
      if (statusEl) {
        statusEl.textContent = `ERROR: ${err.message}`;
        statusEl.className = 'bru-stamp bru-stamp--critical';
      }
    } finally {
      if (btnSweep) btnSweep.disabled = false;
    }
  }

  async handleRedeem(amount) {
    const statusEl = document.getElementById('yieldActionStatus');
    const btnRedeem = document.getElementById('btnRedeemUsyc');

    try {
      if (btnRedeem) btnRedeem.disabled = true;
      if (statusEl) {
        statusEl.textContent = `REDEEMING ${amount.toFixed(2)} USYC FOR JIT LIQUIDITY...`;
        statusEl.className = 'bru-stamp bru-stamp--warning';
      }
      if (window.brutalAudio) window.brutalAudio.dataChirp();

      const res = await fetch('/api/treasury/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      const json = await res.json();

      if (json.success) {
        if (window.brutalAudio) window.brutalAudio.stampThud();
        if (statusEl) {
          statusEl.textContent = `JIT REDEMPTION SUCCESS: ${amount.toFixed(2)} USYC CONVERTED TO LIQUID USDC`;
          statusEl.className = 'bru-stamp bru-stamp--success anim-recovery-stamp';
        }
      } else {
        throw new Error(json.error || 'Redemption failed');
      }

      await this.dashboard.refresh();
    } catch (err) {
      if (window.brutalAudio) window.brutalAudio.alarm();
      if (statusEl) {
        statusEl.textContent = `ERROR: ${err.message}`;
        statusEl.className = 'bru-stamp bru-stamp--critical';
      }
    } finally {
      if (btnRedeem) btnRedeem.disabled = false;
    }
  }
}

window.YieldManager = YieldManager;
