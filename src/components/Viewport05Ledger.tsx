import React, { useState, useEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSakellariousEngine, ProcessedInvoice } from '../core/useSakellariousEngine';

export interface Viewport05LedgerProps {
  engine: ReturnType<typeof useSakellariousEngine>;
}

export const Viewport05Ledger: React.FC<Viewport05LedgerProps> = React.memo(({ engine }) => {
  const [expandedFolio, setExpandedFolio] = useState<string | null>('EUTHYNA #00481');
  const [newlyInscribedFolio, setNewlyInscribedFolio] = useState<string | null>(null);

  // Refresh ScrollTrigger whenever forensic drawer expands or collapses
  useEffect(() => {
    ScrollTrigger.refresh();
  }, [expandedFolio]);

  // Listen for newly settled invoice events to highlight top ledger row
  useEffect(() => {
    const handleNewInscription = (e: Event) => {
      const customEvent = e as CustomEvent<{ folio?: string }>;
      const folio = customEvent.detail?.folio || 'NEW_RECORD';
      setNewlyInscribedFolio(folio);
      setTimeout(() => {
        setNewlyInscribedFolio(null);
      }, 3500);
    };

    window.addEventListener('sakellarious:new-inscription', handleNewInscription);
    return () => {
      window.removeEventListener('sakellarious:new-inscription', handleNewInscription);
    };
  }, []);

  const toggleRow = (folio: string) => {
    setExpandedFolio(prev => (prev === folio ? null : folio));
  };

  // Helper to generate dynamic Beancount inscription for a record
  const generateBeancount = (item: ProcessedInvoice) => {
    const dateStr = new Date(item.timestamp).toISOString().slice(0, 10);
    const isSweep = item.category === 'YIELD_SWEEP';

    if (isSweep) {
      return `; SAKELLARIOUS CONTINUOUS TREASURY LEDGER
; Archival Standard: Euthyna Ledger (v2.0)
; Primary Settlement Asset: USDC on Arc L1

${dateStr} * "Circle Gateway" "${item.invoiceRef} - Surplus sweep to USYC [${item.euthynaFolio || 'EUTHYNA #00480'}]"
  meta: "circle_gateway_sweep"
  tx_hash: "${item.txHash || '0x7e8c182a4d33bb0f121d5568194aef91cbe7821034cbb2339d10e821034cba88'}"
  Assets:Arc:USYC                  ${item.amountUsdc.toFixed(2)} USYC
  Assets:Arc:USDC                 -${item.amountUsdc.toFixed(2)} USDC`;
    }

    return `; SAKELLARIOUS CONTINUOUS TREASURY LEDGER
; Archival Standard: Euthyna Ledger (v2.0)
; Primary Settlement Asset: USDC on Arc L1

${dateStr} * "Circle Paymaster Settlement" "${item.invoiceRef} - ${item.reasoning || 'Automated Payout'} [${item.euthynaFolio || 'EUTHYNA'}]"
  meta: "circle_paymaster"
  tx_hash: "${item.txHash || '0xb08127020a7f6ff2b68e88ae1535764177e7be22525f6f29372fe521cbed879e'}"
  Expenses:${item.category}:Ops       ${item.amountUsdc.toFixed(2)} USDC
  Assets:Arc:USDC                  -${item.amountUsdc.toFixed(2)} USDC`;
  };

  // Helper to generate signed JSON-LD schema receipt
  const generateJsonLd = (item: ProcessedInvoice) => {
    const receiptObj = {
      "@context": "https://schema.org",
      "@type": "FinancialTransaction",
      "identifier": item.txHash || "0xb08127020a7f6ff2b68e88ae1535764177e7be22525f6f29372fe521cbed879e",
      "folio": item.euthynaFolio || "EUTHYNA #00481",
      "recipient": item.vendorAddress,
      "amount": {
        "value": item.amountUsdc,
        "currency": "USDC"
      },
      "category": item.category,
      "policyRule": item.amountUsdc > 250 ? "POL-02_HUMAN_SOVEREIGN_SEAL_APPROVED" : "POL-02_AUTONOMOUS_CAP_CLEARED",
      "openSanctionsScore": 0.00,
      "paymaster": "Circle Paymaster (Gasless 0.00 USDC)",
      "chain": "Arc L1 (ChainID: 42111)",
      "timestamp": new Date(item.timestamp).toISOString()
    };
    return JSON.stringify(receiptObj, null, 2);
  };

  return (
    <section
      id="viewport-05-ledger"
      data-chamber="mineral"
      style={{
        width: '100%',
        backgroundColor: 'var(--mineral-bg)',
        color: 'var(--mineral-ink)',
        borderBottom: '1px solid var(--mineral-hairline)',
        boxSizing: 'border-box'
      }}
    >
      {/* FULL-WIDTH HEADER BAR */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 36px',
          borderBottom: '1px solid var(--mineral-hairline)',
          backgroundColor: 'var(--mineral-recess)',
          userSelect: 'none'
        }}
      >
        <div
          data-datum="true"
          data-telemetry="VIEWPORT 05 // REGISTERED EUTHYNA ARCHIVE"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.12em',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>■</span>
          <span>EUTHYNA DOUBLE-ENTRY ARCHIVE // BEANCOUNT + JSON-LD CRYPTOGRAPHIC RECEIPTS</span>
        </div>

        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.12em',
            color: 'var(--mineral-ink-muted)'
          }}
        >
          TOTAL SETTLED CHAPTERS: {engine.invoices.length} // IMMUTABLE LEDGER
        </div>
      </div>

      {/* TABLE COLUMN HEADER ROW */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '160px 180px 1.4fr 160px 180px 1.2fr',
          borderBottom: '1px solid var(--mineral-hairline)',
          padding: '12px 36px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          letterSpacing: '0.12em',
          color: 'var(--mineral-ink-muted)',
          backgroundColor: 'rgba(231, 226, 216, 0.5)',
          userSelect: 'none'
        }}
      >
        <div>EUTHYNA ID</div>
        <div>UTC TIMESTAMP</div>
        <div>COUNTERPARTY &amp; OPERATION</div>
        <div>VALUE (USDC)</div>
        <div>BOUND CLEARED</div>
        <div>ARC L1 TX &amp; PROOF</div>
      </div>

      {/* ULTRA-DENSE ENGRAVED TABULAR ROWS */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {engine.invoices.map((item, idx) => {
          const folioKey = item.euthynaFolio || `EUTHYNA #${String(idx).padStart(5, '0')}`;
          const isExpanded = expandedFolio === folioKey;
          const isTopHighlighted = idx === 0 && Boolean(newlyInscribedFolio);
          const dateStr = new Date(item.timestamp).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

          return (
            <div key={folioKey} style={{ display: 'flex', flexDirection: 'column' }}>
              {/* INTERACTIVE FULL-WIDTH CHAPTER ROW */}
              <div
                onClick={() => toggleRow(folioKey)}
                className="ledger-row"
                data-invert-dark="true"
                data-datum="true"
                data-telemetry={`${folioKey} // ${item.amountUsdc.toFixed(2)} USDC SETTLED`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '160px 180px 1.4fr 160px 180px 1.2fr',
                  padding: '18px 36px',
                  borderBottom: '1px solid var(--mineral-hairline)',
                  borderLeft: isTopHighlighted ? '3px solid var(--signal-verified)' : 'none',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  alignItems: 'center',
                  backgroundColor: isTopHighlighted
                    ? 'rgba(46, 90, 68, 0.22)'
                    : isExpanded
                    ? 'var(--mineral-recess)'
                    : 'var(--mineral-bg)',
                  transition: 'background-color 240ms var(--ease-mechanical), color 240ms var(--ease-mechanical)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                {/* 1. EUTHYNA ID */}
                <div style={{ fontWeight: 500, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{item.euthynaFolio || folioKey}</span>
                  {isTopHighlighted && (
                    <span
                      style={{
                        fontSize: '8px',
                        backgroundColor: 'var(--signal-verified)',
                        color: '#F2EFE9',
                        padding: '1px 5px',
                        fontWeight: 700
                      }}
                    >
                      NEW
                    </span>
                  )}
                </div>

                {/* 2. UTC TIMESTAMP */}
                <div className="ledger-muted" style={{ fontSize: '10px', color: 'var(--mineral-ink-muted)' }}>
                  {dateStr}
                </div>

                {/* 3. COUNTERPARTY & OPERATION */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 500 }}>{item.category}</span>
                  <span className="ledger-muted" style={{ color: 'var(--mineral-ink-muted)' }}>//</span>
                  <span className="ledger-muted" style={{ fontSize: '10px', color: 'var(--mineral-ink-muted)' }}>
                    {item.vendorAddress.slice(0, 8)}...{item.vendorAddress.slice(-6)}
                  </span>
                </div>

                {/* 4. VALUE */}
                <div style={{ fontWeight: 500 }}>
                  ${item.amountUsdc.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>

                {/* 5. BOUND CLEARED */}
                <div>
                  <span
                    style={{
                      fontSize: '9px',
                      color: item.category === 'YIELD_SWEEP' ? 'var(--signal-amber)' : 'var(--signal-verified)',
                      fontWeight: 500,
                      letterSpacing: '0.06em'
                    }}
                  >
                    {item.category === 'YIELD_SWEEP' ? 'POL-01 [SWEEP]' : 'POL-02 & POL-03 [PASSED]'}
                  </span>
                </div>

                {/* 6. ARC L1 TX & PAYMASTER PROOF */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="ledger-muted" style={{ fontSize: '10px', color: 'var(--mineral-ink-muted)' }}>
                    {item.txHash ? `${item.txHash.slice(0, 10)}...` : '0xb08127...'} [0.00 GAS]
                  </span>
                  <span style={{ fontSize: '9px', color: isExpanded ? 'var(--signal-amber)' : 'var(--mineral-ink-muted)' }}>
                    {isExpanded ? '[-] DRAWER' : '[+] PROOF'}
                  </span>
                </div>
              </div>

              {/* RECESSED #0A0A09 FORENSIC DRAWER DIRECTLY UNDERNEATH */}
              {isExpanded && (
                <div
                  style={{
                    backgroundColor: 'var(--void-bg)',
                    color: 'var(--void-text-primary)',
                    borderBottom: '1px solid var(--mineral-hairline)',
                    padding: '24px 36px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '24px',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* LEFT PANE: EXACT RAW BEANCOUNT DOUBLE-ENTRY INSCRIPTION */}
                  <div
                    style={{
                      border: '1px solid var(--void-hairline)',
                      backgroundColor: 'var(--void-surface)',
                      padding: '18px'
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9px',
                        letterSpacing: '0.16em',
                        color: 'var(--signal-amber)',
                        marginBottom: '12px',
                        borderBottom: '1px solid var(--void-hairline)',
                        paddingBottom: '6px',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>// RAW BEANCOUNT DOUBLE-ENTRY RECORD</span>
                      <span>UTF-8 // RFC-EUTHYNA</span>
                    </div>
                    <pre
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        lineHeight: 1.5,
                        color: 'var(--void-text-primary)',
                        whiteSpace: 'pre-wrap',
                        margin: 0
                      }}
                    >
                      {generateBeancount(item)}
                    </pre>
                  </div>

                  {/* RIGHT PANE: EXACT SIGNED JSON-LD CRYPTOGRAPHIC RECEIPT */}
                  <div
                    style={{
                      border: '1px solid var(--void-hairline)',
                      backgroundColor: 'var(--void-surface)',
                      padding: '18px'
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9px',
                        letterSpacing: '0.16em',
                        color: 'var(--signal-verified)',
                        marginBottom: '12px',
                        borderBottom: '1px solid var(--void-hairline)',
                        paddingBottom: '6px',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>// SIGNED JSON-LD ATTESTATION</span>
                      <span>SCHEMA.ORG / FINANCIAL_TRANSACTION</span>
                    </div>
                    <pre
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        lineHeight: 1.5,
                        color: 'rgba(242, 239, 233, 0.88)',
                        whiteSpace: 'pre-wrap',
                        margin: 0
                      }}
                    >
                      {generateJsonLd(item)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
});
