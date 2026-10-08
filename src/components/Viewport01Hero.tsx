import React from 'react';
import { useSakellariousEngine } from '../core/useSakellariousEngine';
import { useAnimatedNumber } from '../core/useAnimatedNumber';
import { OpticalGovernorCanvas } from './OpticalGovernorCanvas';

export interface Viewport01HeroProps {
  engine: ReturnType<typeof useSakellariousEngine>;
}

export const Viewport01Hero: React.FC<Viewport01HeroProps> = React.memo(({ engine }) => {
  const isHalted = engine.escalations.length > 0;
  const animCustody = useAnimatedNumber(engine.balances.totalArcCapital);

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
          1. TOP PERIMETER STRIP (48px)
          ====================================================================== */}
      <div
        style={{
          height: '48px',
          padding: '0 36px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(242, 239, 233, 0.08)',
          position: 'relative',
          zIndex: 10,
          boxSizing: 'border-box',
          userSelect: 'none'
        }}
      >
        <div
          data-datum="true"
          data-telemetry="SYS // 01 — AUTONOMOUS TREASURY GOVERNOR"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            opacity: 0.45,
            letterSpacing: '0.14em',
            color: 'var(--void-text-primary)'
          }}
        >
          SYS // 01 — AUTONOMOUS TREASURY GOVERNOR
        </div>

        <div
          data-datum="true"
          data-telemetry="ARC L1 POLICYWALLET // 21 MATHEMATICAL GUARDRAILS"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            opacity: 0.45,
            letterSpacing: '0.14em',
            color: 'var(--void-text-primary)'
          }}
        >
          ARC L1 POLICYWALLET // 21 MATHEMATICAL GUARDRAILS
        </div>
      </div>

      {/* ======================================================================
          2. CENTRAL 3D ARENA (flex: 1, pure unobstructed 3D visual space)
          ====================================================================== */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          width: '100%',
          overflow: 'hidden'
        }}
      >
        {/* Subtle Horizontal Datum Hairline */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            width: '100%',
            height: '1px',
            backgroundColor: 'rgba(242, 239, 233, 0.10)',
            zIndex: 3,
            pointerEvents: 'none',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 16px',
            boxSizing: 'border-box'
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.16em',
              color: 'var(--void-text-primary)',
              opacity: 0.32,
              userSelect: 'none'
            }}
          >
            DATUM // Y:00
          </span>

          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.14em',
              color: 'var(--void-text-primary)',
              opacity: 0.32,
              userSelect: 'none'
            }}
          >
            FLOOR // 400,000 USDC
          </span>
        </div>

        {/* Subtle Vertical Datum Meridian (50% Center Axis) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            width: '1px',
            height: '100%',
            backgroundColor: 'rgba(242, 239, 233, 0.10)',
            zIndex: 3,
            pointerEvents: 'none'
          }}
        />

        {/* Central 3D Optical Governor Artifact */}
        <OpticalGovernorCanvas isHalted={isHalted} />
      </div>

      {/* ======================================================================
          3. BOTTOM ARCHITECTURAL PLINTH (156px)
          ====================================================================== */}
      <div
        style={{
          height: '156px',
          borderTop: '1px solid rgba(242, 239, 233, 0.13)',
          backgroundColor: 'rgba(10, 10, 9, 0.78)',
          backdropFilter: 'none',
          display: 'flex',
          width: '100%',
          position: 'relative',
          zIndex: 10,
          boxSizing: 'border-box'
        }}
      >
        {/* Bottom-Left Bay (50%) */}
        <div
          style={{
            width: '50%',
            padding: '24px 36px',
            borderRight: '1px solid rgba(242, 239, 233, 0.13)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box'
          }}
        >
          <div
            data-datum="true"
            data-telemetry="CALIBRATED AUTHORITY // V2.0"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.14em',
              color: 'var(--signal-amber)'
            }}
          >
            CALIBRATED AUTHORITY // V2.0
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.2rem, 3.8vw, 3.9rem)',
              lineHeight: 0.92,
              letterSpacing: '-0.04em',
              color: 'var(--void-text-primary)',
              textTransform: 'uppercase',
              margin: 0,
              whiteSpace: 'nowrap'
            }}
          >
            SAKELLARIOUS
          </h1>

          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              lineHeight: 1.4,
              letterSpacing: '0.01em'
            }}
          >
            <span style={{ color: '#F2EFE9' }}>Autonomous corporate liquidity </span>
            <span style={{ color: 'rgba(242, 239, 233, 0.42)' }}>governed by cryptographic proof.</span>
          </div>
        </div>

        {/* Bottom-Right Bay (50%, 3 equal 1px-bordered columns for VALUE / BOUND / PROOF) */}
        <div
          style={{
            width: '50%',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            boxSizing: 'border-box'
          }}
        >
          {/* Column 1: VALUE */}
          <div
            data-metric="true"
            data-telemetry={`VALUE // $${animCustody.toLocaleString()} TOTAL CUSTODY`}
            style={{
              padding: '22px 28px',
              borderRight: '1px solid rgba(242, 239, 233, 0.13)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxSizing: 'border-box'
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.14em',
                color: 'var(--void-text-muted)',
                textTransform: 'uppercase'
              }}
            >
              01 // VALUE — CUSTODY
            </div>

            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.5rem, 2.2vw, 2.25rem)',
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: '-0.03em',
                fontVariantNumeric: 'tabular-nums',
                color: 'var(--void-text-primary)',
                whiteSpace: 'nowrap'
              }}
            >
              ${Math.round(animCustody).toLocaleString()}
            </div>

            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.08em',
                color: 'var(--void-text-muted)'
              }}
            >
              USDC + USYC RESERVE
            </div>
          </div>

          {/* Column 2: BOUND */}
          <div
            data-metric="true"
            data-telemetry="BOUND // 400K FLOOR & 250 SINGLE-TX CAP"
            style={{
              padding: '22px 28px',
              borderRight: '1px solid rgba(242, 239, 233, 0.13)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxSizing: 'border-box'
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.14em',
                color: 'var(--void-text-muted)',
                textTransform: 'uppercase'
              }}
            >
              02 // BOUND — TOLERANCE
            </div>

            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.5rem, 2.2vw, 2.25rem)',
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: '-0.03em',
                fontVariantNumeric: 'tabular-nums',
                color: 'var(--void-text-primary)',
                whiteSpace: 'nowrap'
              }}
            >
              400K FLOOR
            </div>

            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.08em',
                color: 'var(--void-text-muted)'
              }}
            >
              250 USDC SINGLE-TX CAP
            </div>
          </div>

          {/* Column 3: PROOF */}
          <div
            data-metric="true"
            data-telemetry="PROOF // EUTHYNA #00481 ARC L1 VERIFIED"
            style={{
              padding: '22px 28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxSizing: 'border-box'
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.14em',
                color: 'var(--void-text-muted)',
                textTransform: 'uppercase'
              }}
            >
              03 // PROOF — ARCHIVE
            </div>

            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.5rem, 2.2vw, 2.25rem)',
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: '-0.03em',
                fontVariantNumeric: 'tabular-nums',
                color: 'var(--void-text-primary)',
                whiteSpace: 'nowrap'
              }}
            >
              EUTHYNA #00481
            </div>

            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.08em',
                color: 'var(--signal-amber)'
              }}
            >
              ARC L1 VERIFIED
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});
