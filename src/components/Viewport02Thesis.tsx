import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const Viewport02Thesis: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wordsContainerRef = useRef<HTMLDivElement>(null);
  const marqueeTrackRef = useRef<HTMLDivElement>(null);

  const thesisText =
    "POWER IN AUTONOMOUS FINANCE IS NOT WHAT THE MACHINE CAN SPEND — IT IS THE MATHEMATICAL BOUNDARY IT CANNOT CROSS WITHOUT PROOF.";
  const words = thesisText.split(' ');

  // 1. GSAP SCROLLTRIGGER WORD-BY-WORD OPACITY SCRUBBING (0.25 -> 1.00)
  useEffect(() => {
    if (!wordsContainerRef.current) return;

    const wordSpans = wordsContainerRef.current.querySelectorAll<HTMLSpanElement>('.thesis-word');

    const trigger = gsap.to(wordSpans, {
      opacity: 1,
      color: '#F2EFE9',
      stagger: {
        each: 0.08,
        ease: 'none'
      },
      scrollTrigger: {
        trigger: wordsContainerRef.current,
        start: 'top 78%',
        end: 'bottom 35%',
        scrub: 0.8
      }
    });

    return () => {
      trigger.kill();
    };
  }, []);

  // 2. KINETIC COUNTER-SCROLLING TELEMETRY BAND COUPLED TO VELOCITY
  useEffect(() => {
    const track = marqueeTrackRef.current;
    if (!track) return;

    let animationFrameId: number;
    let offset = 0;
    let scrollVelocity = 0;

    const velocityTrigger = ScrollTrigger.create({
      onUpdate: (self) => {
        scrollVelocity = self.getVelocity();
      }
    });

    const updateMarquee = () => {
      // Base continuous crawl speed: 0.75px per frame
      // Coupled to counter-scroll velocity
      const velocityInfluence = scrollVelocity * 0.015;
      offset -= 0.8 + Math.abs(velocityInfluence);

      // Dampen velocity smoothly
      scrollVelocity *= 0.92;

      // Track width loop calculation
      const singleCycleWidth = track.scrollWidth / 3;
      if (Math.abs(offset) >= singleCycleWidth) {
        offset = 0;
      }

      track.style.transform = `translate3d(${offset}px, 0, 0)`;
      animationFrameId = requestAnimationFrame(updateMarquee);
    };

    animationFrameId = requestAnimationFrame(updateMarquee);

    return () => {
      cancelAnimationFrame(animationFrameId);
      velocityTrigger.kill();
    };
  }, []);

  const telemetryBandTokens = (
    <div style={{ display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
      <span style={{ color: 'var(--signal-tension)', fontWeight: 500 }}>FINANCIAL UNCERTAINTY</span>
      <span style={{ color: 'var(--void-text-muted)', margin: '0 14px' }}>-&gt;</span>
      <span style={{ color: 'var(--signal-verified)', fontWeight: 500 }}>OPENSANCTIONS SCREEN (0.00)</span>
      <span style={{ color: 'var(--void-text-muted)', margin: '0 14px' }}>-&gt;</span>
      <span style={{ color: 'var(--signal-amber)', fontWeight: 500 }}>POLICYWALLET 21 GUARDRAILS</span>
      <span style={{ color: 'var(--void-text-muted)', margin: '0 14px' }}>-&gt;</span>
      <span style={{ color: 'var(--void-text-primary)', fontWeight: 500 }}>CIRCLE PAYMASTER GASLESS EXECUTION</span>
      <span style={{ color: 'var(--void-text-muted)', margin: '0 14px' }}>-&gt;</span>
      <span style={{ color: 'var(--signal-verified)', fontWeight: 500 }}>EUTHYNA BEANCOUNT + JSON-LD PROOF</span>
      <span style={{ color: 'var(--void-text-muted)', margin: '0 24px' }}>//</span>
    </div>
  );

  return (
    <section
      id="viewport-02"
      data-chamber="void"
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        backgroundColor: 'var(--void-surface)',
        color: 'var(--void-text-primary)',
        borderBottom: '1px solid var(--void-hairline)',
        overflow: 'hidden'
      }}
    >
      {/* CONTINUOUS VERTICAL DATUM SPINE (AXIS X:00 ALIGNED FROM VIEWPORT 01) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          width: '1px',
          height: '100%',
          backgroundColor: 'rgba(242, 239, 233, 0.08)',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      {/* ======================================================================
          FULL-BLEED 44PX HORIZONTAL KINETIC TELEMETRY BAND
          (Eliminated borderTop to prevent double-border seam against Viewport 01)
          ====================================================================== */}
      <div
        data-datum="true"
        data-telemetry="PIPELINE // KINETIC TELEMETRY BAND"
        style={{
          width: '100%',
          height: '44px',
          borderBottom: '1px solid var(--void-hairline)',
          backgroundColor: '#070706',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          userSelect: 'none',
          position: 'relative',
          zIndex: 2
        }}
      >
        <div
          ref={marqueeTrackRef}
          style={{
            display: 'flex',
            alignItems: 'center',
            willChange: 'transform',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.12em'
          }}
        >
          {telemetryBandTokens}
          {telemetryBandTokens}
          {telemetryBandTokens}
        </div>
      </div>

      {/* ======================================================================
          EDITORIAL THESIS STATEMENT CHAMBER (INTRA-BLOCK LUMINANCE MODULATION)
          ====================================================================== */}
      <div
        style={{
          maxWidth: '1360px',
          margin: '0 auto',
          padding: '100px 32px 90px 32px',
          boxSizing: 'border-box'
        }}
      >
        {/* Chamber Header Tag */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '48px',
            borderBottom: '1px solid var(--void-hairline)',
            paddingBottom: '14px'
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.2em',
              color: 'var(--signal-amber)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>■</span>
            <span>VIEWPORT 02 // BOUNDED AUTHORITY THESIS</span>
          </div>

          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.14em',
              color: 'var(--void-text-muted)'
            }}
          >
            INVARIANT: NON-DISCRETIONARY SOVEREIGN LIMITS
          </div>
        </div>

        {/* Large Editorial Thesis Statement with GSAP Word Opacity Scrubbing (0.25 -> 1.00) */}
        <div
          ref={wordsContainerRef}
          data-datum="true"
          data-telemetry="THESIS // MATHEMATICAL BOUNDARY SPECIFICATION"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.2rem, 4.4vw, 4.2rem)',
            fontWeight: 700,
            lineHeight: 1.14,
            letterSpacing: '-0.025em',
            textTransform: 'uppercase',
            color: 'var(--void-text-primary)',
            marginBottom: '72px',
            userSelect: 'none'
          }}
        >
          {words.map((word, index) => {
            const isEmphasized =
              word.includes('MATHEMATICAL') ||
              word.includes('BOUNDARY') ||
              word.includes('PROOF.');

            return (
              <span
                key={index}
                className="thesis-word"
                style={{
                  display: 'inline-block',
                  marginRight: '0.28em',
                  opacity: 0.25,
                  color: isEmphasized ? 'var(--signal-amber)' : 'rgba(242, 239, 233, 0.45)',
                  transition: 'opacity 0.2s ease-out'
                }}
              >
                {word}
              </span>
            );
          })}
        </div>

        {/* The 3 Structural Invariants Grid (DESIGN.md Section 1.2) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0',
            borderTop: '1px solid var(--void-hairline)',
            borderLeft: '1px solid var(--void-hairline)',
            borderRight: '1px solid var(--void-hairline)',
            borderBottom: '1px solid var(--void-hairline)'
          }}
        >
          {/* INVARIANT 01 */}
          <div
            data-datum="true"
            data-telemetry="INVARIANT 01 // THE GOVERNANCE DATUM"
            style={{
              padding: '32px 28px',
              borderRight: '1px solid var(--void-hairline)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '220px'
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.16em',
                  color: 'var(--signal-amber)',
                  marginBottom: '12px'
                }}
              >
                01 // THE GOVERNANCE DATUM
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '18px',
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  marginBottom: '12px'
                }}
              >
                ZERO UNANCHORED METRICS
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  color: 'var(--void-text-muted)',
                  lineHeight: 1.6
                }}
              >
                Financial values never float arbitrarily in cards. Every consequential quantity touches a visible, persistent structural boundary—approaching, clearing, or physically halting.
              </p>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                color: 'var(--void-text-muted)',
                letterSpacing: '0.12em',
                marginTop: '16px'
              }}
            >
              [ARC L1 PERSISTENT DATUM]
            </div>
          </div>

          {/* INVARIANT 02 */}
          <div
            data-datum="true"
            data-telemetry="INVARIANT 02 // VALUE-BOUND-PROOF TRIAD"
            style={{
              padding: '32px 28px',
              borderRight: '1px solid var(--void-hairline)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '220px'
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.16em',
                  color: 'var(--signal-amber)',
                  marginBottom: '12px'
                }}
              >
                02 // VALUE — BOUND — PROOF
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '18px',
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  marginBottom: '12px'
                }}
              >
                MANDATORY TRIADIC PROOF
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  color: 'var(--void-text-muted)',
                  lineHeight: 1.6
                }}
              >
                No metric is an isolated number. Consequential metrics simultaneously expose the active value, the mathematical policy bound, and the cryptographic settlement hash.
              </p>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                color: 'var(--void-text-muted)',
                letterSpacing: '0.12em',
                marginTop: '16px'
              }}
            >
              [POLICYWALLET ON-CHAIN ENFORCEMENT]
            </div>
          </div>

          {/* INVARIANT 03 */}
          <div
            data-datum="true"
            data-telemetry="INVARIANT 03 // MATERIAL FIXEDNESS"
            style={{
              padding: '32px 28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '220px'
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.16em',
                  color: 'var(--signal-amber)',
                  marginBottom: '12px'
                }}
              >
                03 // MATERIAL FIXEDNESS
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '18px',
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  marginBottom: '12px'
                }}
              >
                TEMPORAL STATE PHYSICS
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  color: 'var(--void-text-muted)',
                  lineHeight: 1.6
                }}
              >
                Materiality encodes irreversibility: low-opacity hairlines during projection, WebGL tension during contact at the datum, and unmoving archival stone in the Euthyna ledger.
              </p>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                color: 'var(--void-text-muted)',
                letterSpacing: '0.12em',
                marginTop: '16px'
              }}
            >
              [EUTHYNA IMMUTABLE ARCHIVE]
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
