/**
 * Vestiarion AI — Continuous Euthyna Audit Ledger
 * Renders raw plain-text Beancount double-entry ledger stream and JSON-LD receipts.
 */

class AuditLedger {
  constructor() {
    this.activeTab = 'beancount'; // 'beancount' | 'receipts'
    this.rawBeancount = '';
    this.receipts = [];
    this.searchQuery = '';
    this.initEventListeners();
  }

  initEventListeners() {
    // Tabs
    const tabBeancount = document.getElementById('tabAuditBeancount');
    const tabReceipts = document.getElementById('tabAuditReceipts');

    if (tabBeancount && tabReceipts) {
      tabBeancount.addEventListener('click', () => {
        tabBeancount.classList.add('active');
        tabReceipts.classList.remove('active');
        this.activeTab = 'beancount';
        this.render();
        if (window.brutalAudio) window.brutalAudio.click();
      });

      tabReceipts.addEventListener('click', () => {
        tabReceipts.classList.add('active');
        tabBeancount.classList.remove('active');
        this.activeTab = 'receipts';
        this.render();
        if (window.brutalAudio) window.brutalAudio.click();
      });
    }

    // Search query
    const searchInput = document.getElementById('auditSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.render();
      });
    }

    // Download buttons
    const btnDownloadBeancount = document.getElementById('btnDownloadBeancount');
    const btnDownloadReceipts = document.getElementById('btnDownloadReceipts');

    if (btnDownloadBeancount) {
      btnDownloadBeancount.addEventListener('click', () => this.downloadFile(this.rawBeancount, 'euthyna.beancount', 'text/plain'));
    }
    if (btnDownloadReceipts) {
      btnDownloadReceipts.addEventListener('click', () => this.downloadFile(JSON.stringify(this.receipts, null, 2), 'euthyna-receipts.jsonld', 'application/json'));
    }
  }

  async refresh() {
    await Promise.all([
      this.fetchBeancount(),
      this.fetchReceipts()
    ]);
  }

  async fetchBeancount() {
    try {
      const res = await fetch('/api/audit/beancount');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.rawBeancount = await res.text();
      this.render();
    } catch (err) {
      console.warn('[Vestiarion AI] Beancount fetch warning:', err.message);
    }
  }

  async fetchReceipts() {
    try {
      const res = await fetch('/api/audit/receipts');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        this.receipts = json.data;
        this.render();
      }
    } catch (err) {
      console.warn('[Vestiarion AI] Receipts fetch warning:', err.message);
    }
  }

  downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    if (window.brutalAudio) window.brutalAudio.stampThud();
  }

  render() {
    const viewer = document.getElementById('auditViewWindow');
    if (!viewer) return;

    if (this.activeTab === 'beancount') {
      if (!this.searchQuery) {
        viewer.textContent = this.rawBeancount || '; Loading Euthyna Beancount Ledger...';
      } else {
        const lines = (this.rawBeancount || '').split('\n');
        const matched = lines.filter(l => l.toLowerCase().includes(this.searchQuery));
        viewer.textContent = matched.join('\n') || '; [NO BEANCOUNT ENTRIES MATCHING QUERY]';
      }
    } else {
      let filteredReceipts = this.receipts;
      if (this.searchQuery) {
        filteredReceipts = this.receipts.filter(r => JSON.stringify(r).toLowerCase().includes(this.searchQuery));
      }
      viewer.textContent = JSON.stringify(filteredReceipts, null, 2);
    }
  }
}

window.AuditLedger = AuditLedger;
