/**
 * Sakellarious — Chancery Application Bootstrapper
 * Version: 1.0.0
 * Coordinates Chancery Folios, Treasury Ledger, Invoice Dispatch, and Scribe Flow.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Theme Toggle: Ledger (Warm Iron-Gall Dark) vs Parchment (Illuminated Vellum)
  const themeBtn = document.getElementById('themeToggleBtn');
  const savedTheme = localStorage.getItem('sakellarios_theme') || 'ledger';
  document.documentElement.setAttribute('data-theme', savedTheme);

  if (themeBtn) {
    themeBtn.textContent = savedTheme === 'parchment' ? 'THEME: [PARCHMENT]' : 'THEME: [LEDGER]';
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const nextTheme = current === 'parchment' ? 'ledger' : 'parchment';
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('sakellarios_theme', nextTheme);
      themeBtn.textContent = nextTheme === 'parchment' ? 'THEME: [PARCHMENT]' : 'THEME: [LEDGER]';
      if (window.sakellariosAudio) window.sakellariosAudio.pageTurn();
    });
  }

  // 2. Audio Toggle
  const soundBtn = document.getElementById('soundToggleBtn');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      const isMuted = window.sakellariosAudio.toggleMute();
      soundBtn.textContent = isMuted ? 'AUDIO: [MUTED]' : 'AUDIO: [ENGAGED]';
      soundBtn.style.color = isMuted ? 'var(--ink-faint)' : 'var(--gold-leaf)';
      if (!isMuted) window.sakellariosAudio.pageTurn();
    });
  }

  // 3. Chancery Capital Flow Stage Inspector (§4 & §5)
  window.triggerFlowNode = (stage) => {
    if (window.sakellariosAudio) window.sakellariosAudio.pageTurn();
    document.querySelectorAll('.sak-flow-stage').forEach(n => n.classList.remove('active-stage'));
    const targetNode = document.getElementById(`flowNode${stage}`);
    if (targetNode) targetNode.classList.add('active-stage');

    const infoBox = document.getElementById('flowNodeDetailsBox');
    if (!infoBox) return;

    const stageData = {
      1: {
        title: "STAGE 01 — INGESTION & SCRIBE PARSING",
        desc: "Operational bill ingested via API / Agent OCR. Extracts ERC-20 vendor sink address, amount USDC, category tags, and payment justification hash.",
        status: "PARSED_AND_VERIFIED"
      },
      2: {
        title: "STAGE 02 — OPENSANCTIONS CHANCERY SCREENING",
        desc: "Synchronous verification against international SDN, OFAC, and PEP watchlists. In the event of a hit, execution is immediately halted and transaction reverted.",
        status: "SANCTIONS_CLEAN"
      },
      3: {
        title: "STAGE 03 — POLICYWALLET.SOL MATHEMATICAL GUARDRAILS",
        desc: "Evaluates mathematical caps: $250 max single tx limit, $1,000 daily global budget, and category sub-caps (INFRA, PAYROLL, SAAS, VENDOR).",
        status: "21_INVARIANTS_SEALED"
      },
      4: {
        title: "STAGE 04 — GASLESS SETTLEMENT OR SUPERVISOR ESCALATION",
        desc: "Bills <= $250 USDC settle instantly via Circle Paymaster ($0.00 vendor gas fee). Over-limit bills (> $250) route to 3-day human supervisor timelock queue.",
        status: "SETTLEMENT_ARMED"
      }
    };

    const d = stageData[stage];
    if (d) {
      infoBox.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <strong style="color: var(--gold-leaf); font-size: 0.8rem; font-family: var(--font-mono);">${d.title}</strong>
          <span class="sak-seal sak-seal--settled" style="font-size: 0.65rem;">[${d.status}]</span>
        </div>
        <div style="color: var(--ink-secondary); font-size: 0.78rem; font-family: var(--font-ui); line-height: 1.5;">${d.desc}</div>
      `;
    }
  };

  // 4. Instantiate Chancery Subsystems
  const dashboard = new TreasuryDashboard();
  const yieldManager = new YieldManager(dashboard);
  const escalationQueue = new EscalationQueue(dashboard);
  window.escalationQueueInstance = escalationQueue;

  const invoiceWorkbench = new InvoiceWorkbench(dashboard, escalationQueue);
  const auditLedger = new AuditLedger();

  // Initial Data Fetch
  await Promise.all([
    dashboard.refresh(),
    escalationQueue.refresh(),
    auditLedger.refresh()
  ]);

  // Auto-refresh interval (every 6 seconds)
  setInterval(() => {
    dashboard.refresh();
    escalationQueue.refresh();
  }, 6000);

  // 5. Live OpenSanctions Screening Checker
  const btnSanctionsCheck = document.getElementById('btnSanctionsCheck');
  const inputSanctionsAddr = document.getElementById('inputSanctionsAddr');
  const sanctionsVerdictBadge = document.getElementById('sanctionsVerdictBadge');

  if (btnSanctionsCheck && inputSanctionsAddr) {
    btnSanctionsCheck.addEventListener('click', async () => {
      const val = inputSanctionsAddr.value.trim();
      if (!val) return;

      if (sanctionsVerdictBadge) {
        sanctionsVerdictBadge.textContent = 'SCREENING AGAINST SDN...';
        sanctionsVerdictBadge.className = 'sak-seal sak-seal--warning';
      }
      if (window.sakellariosAudio) window.sakellariosAudio.pageTurn();

      try {
        const res = await fetch('/api/sanctions/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ addressOrEntity: val })
        });
        const json = await res.json();

        if (json.success) {
          const isSanctioned = json.data.isSanctioned;
          if (isSanctioned) {
            if (window.sakellariosAudio) window.sakellariosAudio.bellAlert();
            if (sanctionsVerdictBadge) {
              sanctionsVerdictBadge.textContent = 'SDN LISTED // VIOLATION';
              sanctionsVerdictBadge.className = 'sak-seal sak-seal--violation';
            }
          } else {
            if (window.sakellariosAudio) window.sakellariosAudio.sealConfirm();
            if (sanctionsVerdictBadge) {
              sanctionsVerdictBadge.textContent = 'CLEAN RECIPIENT // PROCEED';
              sanctionsVerdictBadge.className = 'sak-seal sak-seal--settled';
            }
          }
        }
      } catch (err) {
        if (sanctionsVerdictBadge) {
          sanctionsVerdictBadge.textContent = 'API SCREENING ERROR';
          sanctionsVerdictBadge.className = 'sak-seal sak-seal--violation';
        }
      }
    });
  }

  // 6. Bind subtle audio
  if (window.sakellariosAudio) {
    window.sakellariosAudio.bindInteractiveElements();
  }

  console.log('[Sakellarious] Byzantine Chancery Ledger Bootstrapped Successfully.');
});
