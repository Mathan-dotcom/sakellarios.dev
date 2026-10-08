import React from 'react';
import { useSakellariousEngine } from '../core/useSakellariousEngine';
import { useLenis } from '../core/SmoothScroll';

export interface CockpitHeaderProps {
  engine: ReturnType<typeof useSakellariousEngine>;
}

export const CockpitHeader: React.FC<CockpitHeaderProps> = ({ engine }) => {
  const { scrollTo } = useLenis();

  const isHalted = engine.escalations.length > 0;
  const pendingAmount = isHalted ? engine.escalations[0].amount : 0;

  const handleCellClick = (targetId: string) => {
    scrollTo(targetId);
  };

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '56px',
        zIndex: 100,
        display: 'flex',
        alignItems: 'stretch',
        backgroundColor: 'rgba(10, 10, 9, 0.92)',
        backdropFilter: 'none', // Strict zero glassmorphism / zero-blur law
        borderBottom: '1px solid var(--void-hairline)',
        userSelect: 'none'
      }}
    >
      {/* LEFT ANCHOR CELL */}
      <div
        className="cockpit-cell"
        onClick={() => handleCellClick('#viewport-01')}
        data-datum="true"
        data-telemetry="ARC L1 GOVERNOR // ROOT TELEMETRY"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '0 20px',
          borderRight: '1px solid var(--void-hairline)',
          height: '100%'
        }}
      >
        {/* Geometric Governor Square Mark */}
        <div
          style={{
            width: '14px',
            height: '14px',
            border: '1px solid var(--void-text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <div
            style={{
              width: '4px',
              height: '4px',
              backgroundColor: isHalted ? 'var(--signal-tension)' : 'var(--signal-amber)'
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.14em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>SAKELLARIOUS</span>
            <span className="cell-muted" style={{ color: 'var(--void-text-muted)' }}>//</span>
            <span className="cell-muted" style={{ color: 'var(--void-text-muted)' }}>ARC L1 GOVERNOR</span>
          </div>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              letterSpacing: '0.12em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span
              className={isHalted ? 'cell-signal' : 'cell-muted'}
              style={{
                color: isHalted ? 'var(--signal-tension)' : 'var(--signal-verified)',
                fontWeight: 500
              }}
            >
              {isHalted ? 'STATE // HALTED AT DATUM' : 'STATE // CALIBRATED'}
            </span>
            <span className="cell-muted" style={{ color: 'var(--void-text-muted)' }}>■</span>
            <span className="cell-muted" style={{ color: 'var(--void-text-muted)' }}>
              BLK #{engine.blockHeight.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* CENTRAL CORRIDOR — Completely unobstructed transparent span for scroll pass-through */}
      <div
        style={{
          flex: 1,
          pointerEvents: 'none'
        }}
      />

      {/* RIGHT CLUSTER: 4 Contiguous Bordered Cells with top-left indices 01 to 04 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          height: '100%'
        }}
      >
        {/* CELL 01: BUFFER */}
        <div
          className="cockpit-cell"
          onClick={() => handleCellClick('#viewport-03-treasury')}
          data-metric="true"
          data-telemetry="01 // BUFFER FLOOR >= 400K USDC"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 16px',
            borderLeft: '1px solid var(--void-hairline)',
            minWidth: '180px'
          }}
        >
          <div
            className="cell-muted"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              letterSpacing: '0.14em',
              color: 'var(--void-text-muted)',
              marginBottom: '2px'
            }}
          >
            01 // BUFFER
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap'
            }}
          >
            <span style={{ fontWeight: 500 }}>
              {engine.balances.arcLiquidUsdc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
            </span>
            <span className="cell-muted" style={{ fontSize: '9px', color: 'var(--void-text-muted)', marginLeft: '6px' }}>
              [FLOOR &gt;= 400K]
            </span>
          </div>
        </div>

        {/* CELL 02: RESERVE */}
        <div
          className="cockpit-cell"
          onClick={() => handleCellClick('#viewport-03-treasury')}
          data-metric="true"
          data-telemetry="02 // RESERVE 1M USYC YIELD"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 16px',
            borderLeft: '1px solid var(--void-hairline)',
            minWidth: '220px'
          }}
        >
          <div
            className="cell-muted"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              letterSpacing: '0.14em',
              color: 'var(--void-text-muted)',
              marginBottom: '2px'
            }}
          >
            02 // RESERVE
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'baseline',
              gap: '6px'
            }}
          >
            <span style={{ fontWeight: 500 }}>
              {engine.balances.arcUsycVault.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USYC
            </span>
            <span
              style={{
                fontSize: '9px',
                color: 'var(--signal-amber)',
                fontWeight: 500
              }}
            >
              +{engine.liveHarvestYield.toFixed(6)}
            </span>
          </div>
        </div>

        {/* CELL 03: ESCALATION */}
        <div
          className="cockpit-cell"
          onClick={() => handleCellClick('#viewport-04-escalation')}
          data-datum="true"
          data-telemetry={isHalted ? '03 // ESCALATION 500 USDC HALTED' : '03 // ESCALATION 0 NOMINAL'}
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 16px',
            borderLeft: '1px solid var(--void-hairline)',
            minWidth: '170px'
          }}
        >
          <div
            className="cell-muted"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              letterSpacing: '0.14em',
              color: 'var(--void-text-muted)',
              marginBottom: '2px'
            }}
          >
            03 // ESCALATION
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap'
            }}
          >
            {isHalted ? (
              <span className="cell-signal" style={{ color: 'var(--signal-tension)', fontWeight: 500 }}>
                {engine.escalations.length} HALTED [{pendingAmount.toFixed(2)} USDC]
              </span>
            ) : (
              <span style={{ color: 'var(--signal-verified)', fontWeight: 500 }}>
                0 NOMINAL
              </span>
            )}
          </div>
        </div>

        {/* CELL 04: LEDGER */}
        <div
          className="cockpit-cell"
          onClick={() => handleCellClick('#viewport-05-ledger')}
          data-datum="true"
          data-telemetry="04 // EUTHYNA #00481 AUDIT LEDGER"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 18px',
            borderLeft: '1px solid var(--void-hairline)',
            minWidth: '160px'
          }}
        >
          <div
            className="cell-muted"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              letterSpacing: '0.14em',
              color: 'var(--void-text-muted)',
              marginBottom: '2px'
            }}
          >
            04 // LEDGER
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
              fontWeight: 500
            }}
          >
            EUTHYNA #00481 <span className="cell-muted" style={{ fontSize: '9px', color: 'var(--void-text-muted)' }}>[ARC L1]</span>
          </div>
        </div>
      </div>
    </header>
  );
};
