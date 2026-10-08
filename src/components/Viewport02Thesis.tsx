import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getScrollVelocity } from '../core/SmoothScroll';

gsap.registerPlugin(ScrollTrigger);

export const Viewport02Thesis: React.FC = React.memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wordsContainerRef = useRef<HTMLDivElement>(null);
  const marqueeTrackRef = useRef<HTMLDivElement>(null);
  const hairlineRef = useRef<HTMLDivElement>(null);

  const thesisText =
    "POWER IN AUTONOMOUS FINANCE IS NOT WHAT THE MACHINE CAN SPEND — IT IS THE MATHEMATICAL BOUNDARY IT CANNOT CROSS WITHOUT PROOF.";
  const words = thesisText.split(' ');

  // 1. GSAP SCROLLTRIGGER WORD-BY-WORD OPACITY SCRUBBING (0.25 -> 1.00) & SHUTTER/HAIRLINE REVEALS
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

    // Animate horizontal structural divider line outward from 50% center meridian
    if (hairlineRef.current) {
      gsap.fromTo(
        hairlineRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 0.85,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );
    }

    return () => {
      trigger.kill();
    };
  }, []);

  // 2. KINETIC COUNTER-SCROLLING TELEMETRY BAND DYNAMICALLY BOOSTED BY SCROLL VELOCITY
  useEffect(() => {
    const track = marqueeTrackRef.current;
    if (!track) return;

    let animationFrameId: number;
    let offset = 0;
    let smoothVel = 0;

    const updateMarquee = () => {
      const rawVel = getScrollVelocity();
      smoothVel += (rawVel - smoothVel) * 0.08;

      // Base crawl speed 0.75px + velocity-coupled dynamic surge
      const boost = Math.abs(smoothVel) * 0.032;
      offset -= 0.85 + boost;

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
          EDITORIAL THESIS STATEMENT CHAMBER (GENEROUS 120PX 72PX CEREMONIAL SPACE)
          ====================================================================== */}
      <div
        style={{
          maxWidth: '1360px',
          margin: '0 auto',
          padding: '120px 72px 100px 72px',
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

        {/* The 3 Structural Invariants Grid (Clean, Decluttered 2-Line Specs at max-width 34ch) */}
        <div
          ref={hairlineRef}
          className="structural-hairline"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0',
            borderTop: '1px solid var(--void-hairline)',
            borderLeft: '1px solid var(--void-hairline)',
            borderRight: '1px solid var(--void-hairline)',
            borderBottom: '1px solid var(--void-hairline)',
            transformOrigin: '50% 50%',
            willChange: 'transform'
          }}
        >
          {/* INVARIANT 01 */}
          <div
            data-datum="true"
            data-telemetry="INVARIANT 01 // THE GOVERNANCE DATUM"
            style={{
              padding: '32px 36px',
              borderRight: '1px solid var(--void-hairline)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '190px'
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.16em',
                  color: 'var(--signal-amber)',
                  marginBottom: '10px'
                }}
              >
                01 // THE GOVERNANCE DATUM
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '17px',
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  marginBottom: '10px'
                }}
              >
                ZERO UNANCHORED METRICS
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  color: 'var(--void-text-muted)',
                  lineHeight: 1.5,
                  maxWidth: '34ch'
                }}
              >
                Every consequential quantity touches a persistent structural boundary—approaching, clearing, or halting.
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
              padding: '32px 36px',
              borderRight: '1px solid var(--void-hairline)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '190px'
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.16em',
                  color: 'var(--signal-amber)',
                  marginBottom: '10px'
                }}
              >
                02 // VALUE — BOUND — PROOF
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '17px',
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  marginBottom: '10px'
                }}
              >
                MANDATORY TRIADIC PROOF
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  color: 'var(--void-text-muted)',
                  lineHeight: 1.5,
                  maxWidth: '34ch'
                }}
              >
                Every transaction couples the active value, policy mathematical bound, and cryptographic settlement proof.
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
              padding: '32px 36px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '190px'
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.16em',
                  color: 'var(--signal-amber)',
                  marginBottom: '10px'
                }}
              >
                03 // MATERIAL FIXEDNESS
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '17px',
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  marginBottom: '10px'
                }}
              >
                TEMPORAL STATE PHYSICS
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  color: 'var(--void-text-muted)',
                  lineHeight: 1.5,
                  maxWidth: '34ch'
                }}
              >
                Materiality reflects irreversibility: projection hairlines, tension collisions, and archival stone receipts.
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
});
