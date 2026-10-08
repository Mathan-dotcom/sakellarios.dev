import React from 'react';
import { useSakellariousEngine } from '../core/useSakellariousEngine';
import { OpticalGovernorCanvas } from './OpticalGovernorCanvas';

export interface Viewport01HeroProps {
  engine: ReturnType<typeof useSakellariousEngine>;
}

export const Viewport01Hero: React.FC<Viewport01HeroProps> = ({ engine }) => {
  const isHalted = engine.escalations.length > 0;
  const pendingEscalation = isHalted ? engine.escalations[0] : null;

  return (
    <section
      id="viewport-01"
      data-chamber="void"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        height: '100vh',
        backgroundColor: 'var(--void-bg)',
        color: 'var(--void-text-primary)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--void-hairline)',
        boxSizing: 'border-box',
        paddingTop: '56px' // Below CockpitHeader
      }}
    >
      {/* ======================================================================
          FULL-VIEWPORT GOVERNANCE DATUM HAIRLINES (INTERSECTING AT 50%, 50%)
          ====================================================================== */}
      {/* Horizontal Hairline */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          width: '100%',
          height: '1px',
          backgroundColor: 'var(--void-datum-line)',
          zIndex: 3,
          pointerEvents: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 24px',
          boxSizing: 'border-box'
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            letterSpacing: '0.16em',
            color: 'var(--void-text-muted)',
            backgroundColor: 'var(--void-bg)',
            padding: '1px 6px',
            border: '1px solid var(--void-hairline)'
          }}
        >
          AXIS Y:00 // HORIZONTAL GOVERNANCE DATUM
        </span>

        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            letterSpacing: '0.14em',
            color: isHalted ? 'var(--signal-tension)' : 'var(--signal-amber)',
            backgroundColor: 'var(--void-bg)',
            padding: '1px 6px',
            border: `1px solid ${isHalted ? 'var(--signal-tension)' : 'var(--signal-amber)'}`
          }}
        >
          400,000.00 USDC OPERATING FLOOR DATUM
        </span>
      </div>

      {/* Vertical Hairline */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          width: '1px',
          height: '100%',
          backgroundColor: 'var(--void-datum-line)',
          zIndex: 3,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '72px 0 24px 0',
          boxSizing: 'border-box'
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            letterSpacing: '0.16em',
            color: 'var(--void-text-muted)',
            backgroundColor: 'var(--void-bg)',
            padding: '1px 6px',
            border: '1px solid var(--void-hairline)',
            whiteSpace: 'nowrap'
          }}
        >
          AXIS X:00 // CENTRAL CHANCERY MERIDIAN
        </span>

        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            letterSpacing: '0.14em',
            color: 'var(--void-text-muted)',
            backgroundColor: 'var(--void-bg)',
            padding: '1px 6px',
            border: '1px solid var(--void-hairline)',
            whiteSpace: 'nowrap'
          }}
        >
          REF: 0x4892 // SAKELLARIOUS ROOT
        </span>
      </div>

      {/* Central Intersection Reticle (Exact 50%, 50%) */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '24px',
          height: '24px',
          zIndex: 4,
          pointerEvents: 'none'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '11px',
            width: '2px',
            height: '24px',
            backgroundColor: 'var(--void-text-primary)'
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '11px',
            left: 0,
            width: '24px',
            height: '2px',
            backgroundColor: 'var(--void-text-primary)'
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '4px',
            left: '4px',
            width: '16px',
            height: '16px',
            border: '1px solid var(--signal-amber)'
          }}
        />
      </div>

      {/* ======================================================================
          BESPOKE THREE.JS OPTICAL GOVERNOR ARTIFACT (CENTER-LOCKED)
          ====================================================================== */}
      <OpticalGovernorCanvas isHalted={isHalted} />

      {/* ======================================================================
          FOREGROUND HUD OVERLAY (ARCHITECTURAL DISPLAY & VALUE-BOUND-PROOF)
          ====================================================================== */}
      {/* TOP HUD BAR */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: '28px 32px 0 32px'
        }}
      >
        {/* Top-Left Telemetry Callout */}
        <div
          data-datum="true"
          data-telemetry="ARC POLICYWALLET // 21 MATHEMATICAL GUARDRAILS"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.18em',
              fontWeight: 500,
              color: 'var(--signal-amber)'
            }}
          >
            ARC POLICYWALLET // 21 MATHEMATICAL GUARDRAILS
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              letterSpacing: '0.12em',
              color: 'var(--void-text-muted)'
            }}
          >
            CONTINUOUS CASH TREASURY OPERATOR // ORTHOGRAPHIC CHANCERY
          </div>
        </div>

        {/* Top-Right Escalation Tension Tag */}
        <div
          data-datum="true"
          data-telemetry={isHalted ? 'ESCALATION // 500.00 USDC HALTED' : 'ESCALATION // NOMINAL'}
          style={{
            border: `1px solid ${isHalted ? 'var(--signal-tension)' : 'var(--void-hairline)'}`,
            backgroundColor: isHalted ? 'rgba(200, 75, 49, 0.12)' : 'var(--void-surface)',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <div
            style={{
              width: '6px',
              height: '6px',
              backgroundColor: isHalted ? 'var(--signal-tension)' : 'var(--signal-verified)'
            }}
          />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em' }}>
            {isHalted ? (
              <span style={{ color: 'var(--signal-tension)', fontWeight: 500 }}>
                EXCEPTION HALTED // {pendingEscalation?.amount.toFixed(2)} USDC &gt; 250.00 CAP
              </span>
            ) : (
              <span style={{ color: 'var(--signal-verified)', fontWeight: 500 }}>
                ALL INVARIANTS CALIBRATED // 0 HALTS
              </span>
            )}
          </div>
        </div>
      </div>

      {/* CENTER HUD: MONUMENTAL ARCHITECTURAL DISPLAY */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '0 32px',
          marginTop: '-40px',
          pointerEvents: 'none'
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.22em',
            color: 'var(--void-text-muted)',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <span>AUTONOMOUS TREASURY GOVERNOR</span>
          <span>//</span>
          <span>ARC L1 NATIVE</span>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(3.8rem, 8.5vw, 8.2rem)',
            fontWeight: 700,
            lineHeight: 0.88,
            letterSpacing: '-0.035em',
            color: 'var(--void-text-primary)',
            textTransform: 'uppercase',
            margin: 0
          }}
        >
          SAKELLARIOUS
        </h1>

        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.14em',
            color: 'var(--void-text-muted)',
            marginTop: '14px',
            maxWidth: '540px',
            lineHeight: 1.6
          }}
        >
          Deterministic corporate capital governor on Arc. Sweeps surplus liquidity to USYC, screens counterparties via OpenSanctions, and halts unproven transactions at the Governance Datum.
        </div>
      </div>

      {/* BOTTOM HUD: VALUE / BOUND / PROOF TRIAD & TELEMETRY CLUSTER */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: '0',
          borderTop: '1px solid var(--void-hairline)',
          backgroundColor: 'rgba(10, 10, 9, 0.85)'
        }}
      >
        {/* VALUE / BOUND / PROOF TRIAD CONTAINER */}
        <div
          data-metric="true"
          data-telemetry="VALUE-BOUND-PROOF // 1,420,000.00 USDC TOTAL CUSTODY"
          style={{
            padding: '24px 32px',
            borderRight: '1px solid var(--void-hairline)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.18em',
              color: 'var(--signal-amber)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>■</span>
            <span>THE VALUE — BOUND — PROOF TRIAD</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '24px'
            }}
          >
            {/* 1. VALUE */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  color: 'var(--void-text-muted)',
                  textTransform: 'uppercase'
                }}
              >
                01 // VALUE [TOTAL CUSTODY]
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(2.4rem, 3.8vw, 3.6rem)',
                  fontWeight: 700,
                  lineHeight: 0.92,
                  letterSpacing: '-0.04em',
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--void-text-primary)'
                }}
              >
                ${engine.balances.totalArcCapital.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  color: 'var(--void-text-muted)',
                  lineHeight: 1.4
                }}
              >
                420K USDC Liquid + 1.0M USYC Vault
              </div>
            </div>

            {/* 2. BOUND */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  color: 'var(--void-text-muted)',
                  textTransform: 'uppercase'
                }}
              >
                02 // BOUND [POLICY CEILING]
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.8rem, 2.6vw, 2.5rem)',
                  fontWeight: 700,
                  lineHeight: 0.92,
                  letterSpacing: '-0.03em',
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--void-text-primary)'
                }}
              >
                ≥ $400K FLOOR
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  color: 'var(--void-text-muted)',
                  lineHeight: 1.4
                }}
              >
                Max Single: $250.00 // Daily: $1,000.00
              </div>
            </div>

            {/* 3. PROOF */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  letterSpacing: '0.16em',
                  color: 'var(--void-text-muted)'
                }}
              >
                03 // PROOF [VERIFIABLE ATTESTATION]
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--signal-verified)',
                  marginTop: '5px'
                }}
              >
                0x9A48F7...2195
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  color: 'var(--void-text-muted)',
                  lineHeight: 1.4
                }}
              >
                Arc L1 PolicyWallet // Euthyna #00481
              </div>
            </div>
          </div>
        </div>

        {/* METROLOGICAL STATUS CLUSTER */}
        <div
          style={{
            padding: '24px 32px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px'
            }}
          >
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--void-text-muted)', letterSpacing: '0.14em' }}>
                RUNWAY PROJECTION
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--void-text-primary)', marginTop: '2px', fontWeight: 500 }}>
                {engine.forecasting.runwayDays.toFixed(1)} DAYS
              </div>
            </div>

            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--void-text-muted)', letterSpacing: '0.14em' }}>
                PAYMASTER EXECUTION
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--void-text-primary)', marginTop: '2px', fontWeight: 500 }}>
                GASLESS (0.00 USDC)
              </div>
            </div>

            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--void-text-muted)', letterSpacing: '0.14em' }}>
                OPENSANCTIONS VERDICT
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--signal-verified)', marginTop: '2px', fontWeight: 500 }}>
                CLEAN // 0 MATCHES
              </div>
            </div>

            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--void-text-muted)', letterSpacing: '0.14em' }}>
                AUDIT STANDARD
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--void-text-primary)', marginTop: '2px', fontWeight: 500 }}>
                BEANCOUNT + JSON-LD
              </div>
            </div>
          </div>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              letterSpacing: '0.16em',
              color: 'var(--void-text-muted)',
              borderTop: '1px solid var(--void-hairline)',
              paddingTop: '10px',
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <span>DISPLACEMENT // 0.0000 ARC DRIFT</span>
            <span style={{ color: 'var(--signal-amber)' }}>SCROLL TO REVEAL THESIS -&gt;</span>
          </div>
        </div>
      </div>
    </section>
  );
};
