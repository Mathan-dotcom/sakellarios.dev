import React, { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSakellariousEngine } from '../core/useSakellariousEngine';

gsap.registerPlugin(ScrollTrigger);

export interface Viewport04EscalationProps {
  engine: ReturnType<typeof useSakellariousEngine>;
}

export const Viewport04Escalation: React.FC<Viewport04EscalationProps> = React.memo(({ engine }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trajectoryRef = useRef<HTMLDivElement>(null);
  const collisionReticleRef = useRef<HTMLDivElement>(null);
  const holdButtonRef = useRef<HTMLDivElement>(null);

  // Press-and-hold 1.20s state
  const [holdProgress, setHoldProgress] = useState(0); // 0 to 1
  const [isHolding, setIsHolding] = useState(false);
  const [isSealed, setIsSealed] = useState(false);

  const holdStartTimeRef = useRef<number | null>(null);
  const holdRafRef = useRef<number | null>(null);

  const isHalted = engine.escalations.length > 0;
  const activeEscalation = isHalted ? engine.escalations[0] : null;

  // 1. SCROLL-COUPLED TRAJECTORY DESCENT SLAMMING INTO DATUM LINE
  useEffect(() => {
    if (!containerRef.current || !trajectoryRef.current) return;

    const anim = gsap.fromTo(
      trajectoryRef.current,
      { scaleY: 0, transformOrigin: 'top center' },
      {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 70%',
          end: 'top 20%',
          scrub: 0.6
        }
      }
    );

    // Event listener to replay the trajectory vector slamming down upon breach auto-glide
    const handleReplayCollision = () => {
      if (!trajectoryRef.current) return;
      const tl = gsap.timeline();
      tl.fromTo(
        trajectoryRef.current,
        { scaleY: 0, transformOrigin: 'top center' },
        { scaleY: 1, duration: 0.68, ease: 'power4.in' }
      );
      if (collisionReticleRef.current) {
        tl.fromTo(
          collisionReticleRef.current,
          { scale: 2.2, filter: 'brightness(2.5)' },
          { scale: 1, filter: 'brightness(1)', duration: 0.5, ease: 'elastic.out(1.2, 0.4)' },
          '-=0.08'
        );
      }
    };

    window.addEventListener('sakellarious:replay-collision', handleReplayCollision);

    return () => {
      anim.kill();
      window.removeEventListener('sakellarious:replay-collision', handleReplayCollision);
    };
  }, []);

  // 2. TACTILE 1.2-SECOND PRESS-AND-HOLD SOVEREIGN SEAL PHYSICS
  const startHold = useCallback(() => {
    if (isSealed || !activeEscalation) return;
    setIsHolding(true);
    holdStartTimeRef.current = performance.now();

    const trackHold = () => {
      if (!holdStartTimeRef.current) return;
      const elapsed = performance.now() - holdStartTimeRef.current;
      const progress = Math.min(1, elapsed / 1200);
      setHoldProgress(progress);

      if (progress >= 1) {
        // Complete Sovereign Seal!
        setIsHolding(false);
        setIsSealed(true);
        engine.approveEscalation(activeEscalation.id);
        setTimeout(() => ScrollTrigger.refresh(), 50);
        return;
      }

      holdRafRef.current = requestAnimationFrame(trackHold);
    };

    holdRafRef.current = requestAnimationFrame(trackHold);
  }, [isSealed, activeEscalation, engine]);

  const endHold = useCallback(() => {
    if (isSealed) return;
    setIsHolding(false);
    holdStartTimeRef.current = null;
    if (holdRafRef.current) {
      cancelAnimationFrame(holdRafRef.current);
    }

    // Damped decay snap-back
    const decay = () => {
      setHoldProgress((prev) => {
        const next = prev * 0.82;
        if (next <= 0.01) return 0;
        requestAnimationFrame(decay);
        return next;
      });
    };
    requestAnimationFrame(decay);
  }, [isSealed]);

  // Window blur listener cancels any active hold
  useEffect(() => {
    const handleBlur = () => {
      endHold();
    };
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, [endHold]);

  // Refresh ScrollTrigger calculations whenever escalation status changes
  useEffect(() => {
    ScrollTrigger.refresh();
  }, [isHalted, isSealed]);

  const handleReject = () => {
    if (!activeEscalation) return;
    engine.cancelEscalation(activeEscalation.id);
    setTimeout(() => ScrollTrigger.refresh(), 50);
  };

  const handleResetDemo = () => {
    setIsSealed(false);
    setHoldProgress(0);
    engine.resetEscalationDemo();
    setTimeout(() => ScrollTrigger.refresh(), 50);
  };

  return (
    <section
      id="viewport-04-escalation"
      data-chamber="void"
      ref={containerRef}
      style={{
        width: '100%',
        backgroundColor: 'var(--void-bg)',
        color: 'var(--void-text-primary)',
        borderBottom: '1px solid var(--void-hairline)',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* SECTION TOP SUB-BAR */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 36px',
          borderBottom: '1px solid var(--void-hairline)',
          backgroundColor: '#070706',
          userSelect: 'none'
        }}
      >
        <div
          data-datum="true"
          data-telemetry="VIEWPORT 04 // GOVERNANCE DATUM COLLISION"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.18em',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span style={{ color: isHalted ? 'var(--signal-tension)' : 'var(--signal-verified)' }}>■</span>
          <span>VIEWPORT 04 // THE GOVERNANCE DATUM COLLISION &amp; HUMAN ESCALATION CHAMBER</span>
        </div>

        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            letterSpacing: '0.14em',
            color: 'var(--void-text-muted)'
          }}
        >
          {isHalted ? 'STATUS: EXCEPTION HALTED AT DATUM' : 'STATUS: SOVEREIGN SEAL REGISTERED'}
        </div>
      </div>

      {/* CHAMBER CORE CONTAINER */}
      <div
        style={{
          maxWidth: '1360px',
          margin: '0 auto',
          padding: '64px 36px 72px 36px',
          boxSizing: 'border-box'
        }}
      >
        {/* UPPER DESCENT STAGE (TRANSACTION TRAJECTORY DESCENDING TO DATUM) */}
        <div
          style={{
            position: 'relative',
            height: '140px',
            borderLeft: '1px solid var(--void-hairline)',
            borderRight: '1px solid var(--void-hairline)',
            borderTop: '1px solid var(--void-hairline)',
            backgroundColor: '#070706',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start'
          }}
        >
          {/* Telemetry Milestones along the descent path */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              left: '24px',
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              letterSpacing: '0.12em',
              color: 'var(--signal-verified)'
            }}
          >
            [1] OPENSANCTIONS: 0.00 PASSED // CLEAN RECIPIENT
          </div>

          <div
            style={{
              position: 'absolute',
              top: '56px',
              left: '24px',
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              letterSpacing: '0.12em',
              color: 'var(--signal-verified)'
            }}
          >
            [2] 30D LIQUIDITY FLOOR CHECK: 420K &gt; 400K PASSED
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '24px',
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              letterSpacing: '0.12em',
              color: isHalted ? 'var(--signal-tension)' : 'var(--signal-verified)',
              fontWeight: 500
            }}
          >
            [3] SINGLE TRANSACTION CEILING CHECK: {isHalted ? '500.00 USDC > 250.00 USDC [BREACH]' : 'RESOLVED'}
          </div>

          {/* Center Vertical Trajectory Descent Hairline */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '2px',
              height: '100%',
              backgroundColor: 'rgba(242, 239, 233, 0.1)'
            }}
          >
            <div
              ref={trajectoryRef}
              style={{
                width: '100%',
                backgroundColor: isHalted ? 'var(--signal-tension)' : 'var(--signal-verified)',
                height: '100%',
                transform: 'scaleY(0)',
                transformOrigin: 'top center',
                willChange: 'transform'
              }}
            />
          </div>

          {/* Right Stage Telemetry Box */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              right: '24px',
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              letterSpacing: '0.14em',
              color: 'var(--void-text-muted)',
              textAlign: 'right'
            }}
          >
            TRAJECTORY VECTOR // DESCENDING
            <div style={{ color: 'var(--void-text-primary)', marginTop: '4px' }}>
              NONCE #{activeEscalation ? activeEscalation.escalationNonce : 1}
            </div>
          </div>
        </div>

        {/* ====================================================================
            THE GOVERNANCE DATUM LINE (HEAVY 2PX #C84B31 / #2E5A44 SPANNING FULL WIDTH)
            ==================================================================== */}
        <div
          data-datum="true"
          data-telemetry="DATUM LINE // 250.00 USDC AUTONOMOUS BOUNDARY"
          style={{
            position: 'relative',
            width: '100%',
            height: '2px',
            backgroundColor: isHalted ? 'var(--signal-tension)' : 'var(--signal-verified)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 24px',
            boxSizing: 'border-box',
            userSelect: 'none'
          }}
        >
          {/* Left Datum Marker */}
          <div
            style={{
              position: 'absolute',
              top: '-10px',
              left: '12px',
              backgroundColor: isHalted ? 'var(--signal-tension)' : 'var(--signal-verified)',
              color: '#0A0A09',
              fontFamily: 'var(--font-mono)',
              fontSize: '8px',
              fontWeight: 700,
              letterSpacing: '0.14em',
              padding: '2px 8px'
            }}
          >
            250.00 USDC GOVERNANCE DATUM
          </div>

          {/* Center Collision Impact Reticle */}
          <div
            ref={collisionReticleRef}
            style={{
              position: 'absolute',
              top: '-9px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '18px',
              height: '18px',
              border: `2px solid ${isHalted ? 'var(--signal-tension)' : 'var(--signal-verified)'}`,
              backgroundColor: 'var(--void-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                backgroundColor: isHalted ? 'var(--signal-tension)' : 'var(--signal-verified)'
              }}
            />
          </div>

          {/* Right Datum Status */}
          <div
            style={{
              position: 'absolute',
              top: '-10px',
              right: '12px',
              backgroundColor: 'var(--void-surface)',
              border: `1px solid ${isHalted ? 'var(--signal-tension)' : 'var(--signal-verified)'}`,
              color: isHalted ? 'var(--signal-tension)' : 'var(--signal-verified)',
              fontFamily: 'var(--font-mono)',
              fontSize: '8px',
              fontWeight: 500,
              letterSpacing: '0.14em',
              padding: '2px 8px'
            }}
          >
            {isHalted ? 'COLLISION DEADLOCK // 100% ENERGY ABSORBED' : 'VECTOR CLEARED // RELEASED TO EUTHYNA'}
          </div>
        </div>

        {/* ACTIVE ESCALATION DOSSIER CONTAINER (VALUE / BOUND / PROOF TRIAD) */}
        <div
          style={{
            borderLeft: '1px solid var(--void-hairline)',
            borderRight: '1px solid var(--void-hairline)',
            borderBottom: '1px solid var(--void-hairline)',
            backgroundColor: 'var(--void-surface)',
            padding: '40px',
            boxSizing: 'border-box'
          }}
        >
          {isHalted && activeEscalation ? (
            <div>
              {/* Top Dossier Identification */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '28px',
                  borderBottom: '1px solid var(--void-hairline)',
                  paddingBottom: '18px'
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      letterSpacing: '0.18em',
                      color: 'var(--signal-tension)',
                      marginBottom: '4px'
                    }}
                  >
                    // ESCALATION DOSSIER: NONCE #{activeEscalation.escalationNonce}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--void-text-muted)' }}>
                    INVOICE: <strong>{activeEscalation.invoiceRef}</strong> // VENDOR: <strong>{activeEscalation.vendor}</strong>
                  </div>
                </div>

                <div
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'rgba(200, 75, 49, 0.15)',
                    border: '1px solid var(--signal-tension)',
                    color: 'var(--signal-tension)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    letterSpacing: '0.1em'
                  }}
                >
                  HALTED AT GOVERNANCE DATUM
                </div>
              </div>

              {/* STRICT VALUE / BOUND / PROOF TRIAD */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '24px',
                  marginBottom: '36px'
                }}
              >
                {/* 1. VALUE */}
                <div
                  data-metric="true"
                  data-telemetry="VALUE // 500.00 USDC VENDOR OBLIGATION"
                  style={{
                    padding: '24px',
                    border: '1px solid var(--void-hairline)',
                    backgroundColor: 'var(--void-bg)'
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--void-text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    01 // VALUE [PENDING EXECUTION]
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(3.25rem, 5.5vw, 6rem)',
                      fontWeight: 700,
                      lineHeight: 0.92,
                      letterSpacing: '-0.04em',
                      fontVariantNumeric: 'tabular-nums',
                      color: 'var(--void-text-primary)',
                      marginTop: '8px'
                    }}
                  >
                    ${activeEscalation.amount.toFixed(2)}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--void-text-muted)', marginTop: '6px', letterSpacing: '0.12em' }}>
                    CATEGORY: {activeEscalation.category} // TIMELOCK: 72H
                  </div>
                </div>

                {/* 2. BOUND HIT */}
                <div
                  data-datum="true"
                  data-telemetry="BOUND HIT // 250.00 USDC CAP (200% BREACH)"
                  style={{
                    padding: '24px',
                    border: '1px solid rgba(200, 75, 49, 0.4)',
                    backgroundColor: 'rgba(200, 75, 49, 0.06)'
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--signal-tension)', letterSpacing: '0.16em' }}>
                    02 // BOUND HIT [POLICY VIOLATION]
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '24px',
                      fontWeight: 700,
                      color: 'var(--signal-tension)',
                      marginTop: '8px'
                    }}
                  >
                    &gt; 250.00 USDC CAP
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--void-text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
                    BREACH DELTA: +250.00 USDC (200% OF AUTHORITY). Halted against on-chain PolicyWallet.
                  </div>
                </div>

                {/* 3. PROOF PRE-CHECK */}
                <div
                  data-metric="true"
                  data-telemetry="PROOF PRE-CHECK // OPENSANCTIONS: 0.00 CLEAN"
                  style={{
                    padding: '24px',
                    border: '1px solid var(--void-hairline)',
                    backgroundColor: 'var(--void-bg)'
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--signal-verified)', letterSpacing: '0.16em' }}>
                    03 // PROOF PRE-CHECK [VALIDATED]
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '18px',
                      fontWeight: 500,
                      color: 'var(--signal-verified)',
                      marginTop: '8px'
                    }}
                  >
                    CLEAN (0.00 SCORE)
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--void-text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
                    30D Floor Post-Tx: $419,500 USDC [SAFE] // Awaiting Human Sovereign Seal.
                  </div>
                </div>
              </div>

              {/* TACTILE 1.2-SECOND PRESS-AND-HOLD SOVEREIGN SEAL BAR */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  ref={holdButtonRef}
                  tabIndex={0}
                  role="button"
                  aria-label="Press and hold Space or Enter for 1.20 seconds to countersign sovereign seal"
                  onPointerDown={(e) => {
                    try {
                      e.currentTarget.setPointerCapture(e.pointerId);
                    } catch {}
                    startHold();
                  }}
                  onPointerUp={(e) => {
                    try {
                      e.currentTarget.releasePointerCapture(e.pointerId);
                    } catch {}
                    endHold();
                  }}
                  onPointerLeave={endHold}
                  onPointerCancel={endHold}
                  onBlur={endHold}
                  onKeyDown={(e) => {
                    if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
                      e.preventDefault();
                      startHold();
                    }
                  }}
                  onKeyUp={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      endHold();
                    }
                  }}
                  data-datum="true"
                  data-telemetry="ACTION // 1.20S SOVEREIGN SEAL RELEASE"
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '56px',
                    backgroundColor: '#1E1210',
                    border: '1px solid var(--signal-tension)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 24px',
                    boxSizing: 'border-box',
                    userSelect: 'none',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  {/* Dynamic Progress Fill Bar (GPU ScaleX) */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      width: '100%',
                      backgroundColor: 'var(--signal-tension)',
                      pointerEvents: 'none',
                      transform: `scaleX(${holdProgress})`,
                      transformOrigin: 'left center',
                      willChange: 'transform',
                      transition: isHolding ? 'none' : 'transform 0.22s var(--ease-damped-settle)'
                    }}
                  />

                  {/* Foreground Action Text */}
                  <div
                    style={{
                      position: 'relative',
                      zIndex: 2,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.14em',
                      color: holdProgress > 0.4 ? '#0A0A09' : '#F2EFE9',
                      textTransform: 'uppercase'
                    }}
                  >
                    PRESS &amp; HOLD (1.20S) TO COUNTERSIGN SOVEREIGN SEAL &amp; RELEASE ACROSS DATUM
                  </div>

                  {/* Live Millisecond Counter */}
                  <div
                    style={{
                      position: 'relative',
                      zIndex: 2,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      fontWeight: 500,
                      letterSpacing: '0.1em',
                      color: holdProgress > 0.4 ? '#0A0A09' : 'var(--signal-tension)'
                    }}
                  >
                    {isHolding ? `HOLDING // ${(holdProgress * 1.2).toFixed(2)}s / 1.20s` : 'READY // 0.00s / 1.20s'}
                  </div>
                </div>

                {/* Secondary Action: Reject & Void Obligation */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    onClick={handleReject}
                    data-datum="true"
                    data-telemetry="ACTION // REJECT & VOID OBLIGATION"
                    style={{
                      padding: '10px 18px',
                      backgroundColor: 'transparent',
                      color: 'var(--void-text-muted)',
                      border: '1px solid var(--void-hairline)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      cursor: 'pointer'
                    }}
                  >
                    [ REJECT &amp; VOID OBLIGATION ]
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* CALIBRATED / RESOLVED STATE */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 20px',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: 'var(--signal-verified)',
                  marginBottom: '16px'
                }}
              />
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '24px',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  marginBottom: '8px',
                  color: 'var(--signal-verified)'
                }}
              >
                SOVEREIGN SEAL REGISTERED — RELEASED TO EUTHYNA
              </h2>
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: 'var(--void-text-muted)',
                  maxWidth: '560px',
                  lineHeight: 1.6,
                  marginBottom: '28px'
                }}
              >
                The 500.00 USDC transaction vector crossed downward through the Governance Datum line. Cryptographic proof has been committed to the immutable Euthyna ledger.
              </p>

              <button
                onClick={handleResetDemo}
                data-datum="true"
                data-telemetry="DEMO // RESET 500 USDC ESCALATION COLLISION"
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'var(--void-surface)',
                  color: 'var(--signal-amber)',
                  border: '1px solid var(--signal-amber)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 500,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  cursor: 'pointer'
                }}
              >
                [ RESET 500 USDC ESCALATION DEMO ]
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
});
