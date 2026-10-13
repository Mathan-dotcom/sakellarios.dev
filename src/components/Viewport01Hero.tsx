import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useSakellariousEngine } from '../core/useSakellariousEngine';
import { useAnimatedNumber } from '../core/useAnimatedNumber';
import { OpticalGovernorCanvas } from './OpticalGovernorCanvas';
import { BleibtgleichCursorOverlay } from './BleibtgleichCursorOverlay';

export interface Viewport01HeroProps {
  engine: ReturnType<typeof useSakellariousEngine>;
}

export const Viewport01Hero: React.FC<Viewport01HeroProps> = React.memo(({ engine }) => {
  const isHalted = engine.escalations.length > 0;

  // Refs for 1.35-second choreographed instrument boot sequence
  const heroRef = useRef<HTMLElement>(null);
  const horizontalDatumRef = useRef<HTMLDivElement>(null);
  const verticalDatumRef = useRef<HTMLDivElement>(null);
  const topStripRef = useRef<HTMLDivElement>(null);
  const bottomPlinthRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const bootProgressRef = useRef(0);


  // Critically damped mechanical metric roll-ups from 0
  const animCustody = useAnimatedNumber(engine.balances.totalArcCapital, 750, 0);
  const animFloor = useAnimatedNumber(engine.forecasting.targetBuffer30D, 750, 0);
  const animFolio = useAnimatedNumber(481, 750, 0);

  // 1. CHOREOGRAPHED 1.35-SECOND INSTRUMENT BOOT SEQUENCE
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

    // 0.00s–0.45s: Hairlines draw outward from center intersection (50%, 50%)
    if (horizontalDatumRef.current) {
      tl.fromTo(
        horizontalDatumRef.current,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.45, ease: 'expo.out' },
        0
      );
    }
    if (verticalDatumRef.current) {
      tl.fromTo(
        verticalDatumRef.current,
        { scaleY: 0 },
        { scaleY: 1, duration: 0.45, ease: 'expo.out' },
        0
      );
    }

    // 0.15s–1.10s: Pass uBootProgress (0.0 -> 1.0) uniform convergence
    tl.fromTo(
      bootProgressRef,
      { current: 0 },
      { current: 1, duration: 0.95, ease: 'expo.out' },
      0.15
    );

    // 0.45s–1.20s: Reveal Top Perimeter Strip, Bottom Plinth, and SAKELLARIOUS display title
    if (topStripRef.current) {
      tl.fromTo(
        topStripRef.current,
        { opacity: 0, y: -16 },
        { opacity: 1, y: 0, duration: 0.55, ease: 'expo.out' },
        0.45
      );
    }
    if (bottomPlinthRef.current) {
      tl.fromTo(
        bottomPlinthRef.current,
        { y: '100%', opacity: 0 },
        { y: '0%', opacity: 1, duration: 0.75, ease: 'expo.out' },
        0.45
      );
    }
    if (titleRef.current) {
      tl.fromTo(
        titleRef.current,
        { y: '105%' },
        { y: '0%', duration: 0.75, ease: 'power4.out' },
        0.55
      );
    }

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section
      id="viewport-01"
      ref={heroRef}
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
        ref={topStripRef}
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
          userSelect: 'none',
          pointerEvents: 'none'
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
            color: 'var(--void-text-primary)',
            pointerEvents: 'auto'
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
            color: 'var(--void-text-primary)',
            pointerEvents: 'auto'
          }}
        >
          ARC L1 POLICYWALLET // 21 MATHEMATICAL GUARDRAILS
        </div>
      </div>

      {/* ======================================================================
          LAYER 0: CENTRAL 3D ARENA & OPTICAL GOVERNOR (Z-INDEX: 0)
          The hidden base layer. 3D Governor spins underneath the dark shroud.
          ====================================================================== */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          zIndex: 0
        }}
      >
        {/* Subtle Horizontal Datum Hairline */}
        <div
          ref={horizontalDatumRef}
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
            boxSizing: 'border-box',
            transformOrigin: '50% 50%',
            willChange: 'transform'
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
            AXIS Y:00 // DATUM
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
          ref={verticalDatumRef}
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            width: '1px',
            height: '100%',
            backgroundColor: 'rgba(242, 239, 233, 0.10)',
            zIndex: 3,
            pointerEvents: 'none',
            transformOrigin: '50% 50%',
            willChange: 'transform'
          }}
        />

        {/* Central 3D Optical Governor Artifact */}
        <OpticalGovernorCanvas isHalted={isHalted} bootProgressRef={bootProgressRef} />
      </div>

      {/* ======================================================================
          2. THE DEAD-CENTER MONUMENT (Main Title floating in the void)
          ====================================================================== */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          pointerEvents: 'none',
          width: '100%',
          zIndex: 10,
          boxSizing: 'border-box',
          padding: '0 2rem'
        }}
      >
        <div
          data-datum="true"
          data-telemetry="CALIBRATED AUTHORITY // V2.0"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.18em',
            color: '#D4943A',
            marginBottom: '0.75rem',
            textTransform: 'uppercase'
          }}
        >
          CALIBRATED AUTHORITY // V2.0
        </div>

        <div style={{ overflow: 'hidden' }}>
          <h1
            ref={titleRef}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.8rem, 6.2vw, 6.5rem)',
              lineHeight: 0.92,
              letterSpacing: '-0.04em',
              color: '#FFFFFF',
              textTransform: 'uppercase',
              margin: 0,
              whiteSpace: 'nowrap'
            }}
          >
            SAKELLARIOUS
          </h1>
        </div>

        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'clamp(13px, 1.1vw, 15px)',
            lineHeight: 1.45,
            letterSpacing: '0.015em',
            marginTop: '0.9rem',
            maxWidth: '520px'
          }}
        >
          <span style={{ color: '#FFFFFF', opacity: 0.88 }}>Autonomous corporate liquidity </span>
          <span style={{ color: 'rgba(255, 255, 255, 0.45)' }}>governed by cryptographic proof.</span>
        </div>
      </div>

      {/* ======================================================================
          3. THE PURE DATA PLINTH (Bottom Footer)
          ====================================================================== */}
      <footer
        ref={bottomPlinthRef}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '2rem',
          alignItems: 'end',
          width: '100%',
          position: 'absolute',
          bottom: 0,
          left: 0,
          padding: '2rem',
          background: 'rgba(10, 10, 9, 0.5)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          zIndex: 20,
          boxSizing: 'border-box',
          userSelect: 'none',
          pointerEvents: 'none'
        }}
      >
        {/* Column 1: VALUE (Left-aligned) */}
        <div
          data-metric="true"
          data-monumental="true"
          data-telemetry="CUSTODY LENS // $1,420,000 ARC L1 RESERVE"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            background: 'transparent',
            pointerEvents: 'auto',
            textAlign: 'left'
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.14em',
              color: 'rgba(255, 255, 255, 0.45)',
              textTransform: 'uppercase',
              background: 'transparent'
            }}
          >
            01 // VALUE — CUSTODY
          </div>

          <div
            className="hero-syne-metric"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.4rem, 2.2vw, 2.25rem)',
              fontWeight: 700,
              lineHeight: 1,
              margin: 0,
              display: 'block',
              letterSpacing: '-0.03em',
              fontVariantNumeric: 'tabular-nums',
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
              background: 'transparent'
            }}
          >
            ${Math.round(animCustody).toLocaleString()}
          </div>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.08em',
              color: 'rgba(255, 255, 255, 0.45)',
              background: 'transparent'
            }}
          >
            USDC + USYC RESERVE
          </div>
        </div>

        {/* Column 2: BOUND (Center-aligned) */}
        <div
          data-metric="true"
          data-telemetry="BOUND // 400K FLOOR & 250 SINGLE-TX CAP"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'transparent',
            pointerEvents: 'auto',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.14em',
              color: 'rgba(255, 255, 255, 0.45)',
              textTransform: 'uppercase',
              background: 'transparent'
            }}
          >
            02 // BOUND — TOLERANCE
          </div>

          <div
            className="hero-syne-metric"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.3rem, 1.9vw, 2.25rem)',
              fontWeight: 700,
              lineHeight: 1,
              margin: 0,
              display: 'block',
              letterSpacing: '-0.03em',
              fontVariantNumeric: 'tabular-nums',
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
              background: 'transparent'
            }}
          >
            {Math.round(animFloor / 1000)}K FLOOR
          </div>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.08em',
              color: 'rgba(255, 255, 255, 0.45)',
              background: 'transparent'
            }}
          >
            250 USDC SINGLE-TX CAP
          </div>
        </div>

        {/* Column 3: PROOF (Right-aligned) */}
        <div
          data-metric="true"
          data-telemetry="PROOF // EUTHYNA #00481 ARC L1 VERIFIED"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '0.5rem',
            background: 'transparent',
            pointerEvents: 'auto',
            textAlign: 'right'
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.14em',
              color: 'rgba(255, 255, 255, 0.45)',
              textTransform: 'uppercase',
              background: 'transparent'
            }}
          >
            03 // PROOF — ARCHIVE
          </div>

          <div
            className="hero-syne-metric"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.3rem, 1.9vw, 2.25rem)',
              fontWeight: 700,
              lineHeight: 1,
              margin: 0,
              display: 'block',
              letterSpacing: '-0.03em',
              fontVariantNumeric: 'tabular-nums',
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
              background: 'transparent'
            }}
          >
            EUTHYNA #{String(Math.round(animFolio)).padStart(5, '0')}
          </div>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.08em',
              color: '#D4943A',
              background: 'transparent'
            }}
          >
            ARC L1 VERIFIED
          </div>
        </div>
      </footer>

      {/* ======================================================================
          LAYER 1: BLEIBTGLEICH REVEALER SHROUD OVERLAY (Z-INDEX: 1)
          Stacking Order:
          1. OpticalGovernorCanvas (zIndex: 0, Hidden base layer)
          2. BleibtgleichCursorOverlay (zIndex: 1, Dark shroud & fluid eraser)
          3. Hero Typography/UI Grids (zIndex: 10, Strictly floating on top)
          ====================================================================== */}
      <BleibtgleichCursorOverlay zIndex={1} />
    </section>
  );
});
