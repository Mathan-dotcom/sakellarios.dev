import React, { useEffect, useRef, useState } from 'react';

export const CaliperCursor: React.FC = React.memo(() => {
  const [isLocked, setIsLocked] = useState(false);
  const [isLightSurface, setIsLightSurface] = useState(false);
  const [telemetry, setTelemetry] = useState<string>('DATUM LOCKED');

  const containerRef = useRef<HTMLDivElement>(null);
  const reticleRef = useRef<HTMLDivElement>(null);
  const caliperRef = useRef<HTMLDivElement>(null);
  const coordsTextRef = useRef<HTMLSpanElement>(null);

  const targetPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const hasReceivedPointer = useRef(false);
  const isLockedRef = useRef(false);
  const telemetryRef = useRef('DATUM LOCKED');
  const isLightSurfaceRef = useRef(false);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    // Only mount cursor telemetry on devices with mouse/pointer
    if (typeof window === 'undefined' || !window.matchMedia('(hover: hover)').matches) {
      return;
    }

    // Zero-latency raw pointermove listener (NO React setState or getComputedStyle)
    const handlePointerMove = (e: PointerEvent) => {
      const { clientX, clientY } = e;
      targetPos.current.x = clientX;
      targetPos.current.y = clientY;

      if (!hasReceivedPointer.current) {
        hasReceivedPointer.current = true;
        currentPos.current.x = clientX;
        currentPos.current.y = clientY;
        if (containerRef.current) {
          containerRef.current.style.opacity = '1';
        }
      }

      // 0ms Primary Reticle Position Update via direct DOM transform
      if (reticleRef.current) {
        reticleRef.current.style.transform = `translate3d(${clientX}px, ${clientY}px, 0)`;
      }

      // Direct DOM update for micro-coordinate readout (Zero React re-renders)
      if (coordsTextRef.current) {
        coordsTextRef.current.textContent = `X:${Math.round(clientX).toString().padStart(4, '0')}`;
      }
    };

    // Event delegation on pointerover for hover targets and chamber polarity detection
    const handlePointerOver = (e: PointerEvent) => {
      const targetEl = e.target as Element | null;
      if (!targetEl) return;

      // 1. Yield / dim cursor when hovering interactive text inputs/textareas
      const isInput = Boolean(targetEl.closest('input, textarea, [contenteditable="true"]'));
      if (containerRef.current) {
        containerRef.current.style.opacity = isInput ? '0.12' : '1';
      }

      // 2. Chamber polarity detection
      const chamberEl = targetEl.closest('[data-chamber]');
      const isMineralChamber = chamberEl?.getAttribute('data-chamber') === 'mineral';
      const isCockpitCell = Boolean(targetEl.closest('.cockpit-cell'));
      const isDarkInverted = Boolean(
        targetEl.closest('.rule-bay, .ledger-row, .tactical-button, [data-invert-dark="true"]')
      );

      let light = false;
      if (isCockpitCell) {
        light = true;
      } else if (isMineralChamber) {
        light = !isDarkInverted;
      } else {
        light = false;
      }

      if (light !== isLightSurfaceRef.current) {
        isLightSurfaceRef.current = light;
        setIsLightSurface(light);
      }

      // 3. Snap target detection
      const snapTarget = targetEl.closest('[data-datum], [data-metric], [data-telemetry]');
      if (snapTarget) {
        const text =
          snapTarget.getAttribute('data-telemetry') ||
          (snapTarget.getAttribute('data-metric') ? 'METRIC LOCKED' : 'DATUM LOCKED');

        if (!isLockedRef.current || telemetryRef.current !== text) {
          isLockedRef.current = true;
          telemetryRef.current = text;
          setIsLocked(true);
          setTelemetry(text);
        }
      } else {
        if (isLockedRef.current) {
          isLockedRef.current = false;
          telemetryRef.current = '';
          setIsLocked(false);
          setTelemetry('');
        }
      }
    };

    const handlePointerOut = (e: PointerEvent) => {
      if (!e.relatedTarget) {
        if (containerRef.current) {
          containerRef.current.style.opacity = '0';
        }
        if (isLockedRef.current) {
          isLockedRef.current = false;
          setIsLocked(false);
        }
      }
    };

    // Trailing Caliper Frame RAF loop with exact lerp: 0.18
    const animate = () => {
      const lerpFactor = 0.18;
      currentPos.current.x += (targetPos.current.x - currentPos.current.x) * lerpFactor;
      currentPos.current.y += (targetPos.current.y - currentPos.current.y) * lerpFactor;

      if (caliperRef.current) {
        caliperRef.current.style.transform = `translate3d(${currentPos.current.x}px, ${currentPos.current.y}px, 0)`;
      }

      animationFrameId.current = requestAnimationFrame(animate);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('pointerover', handlePointerOver, { passive: true });
    document.addEventListener('pointerout', handlePointerOut, { passive: true });
    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerover', handlePointerOver);
      document.removeEventListener('pointerout', handlePointerOut);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  const frameSize = isLocked ? 44 : 28;
  const halfSize = frameSize / 2;

  const reticleColor = isLightSurface
    ? (isLocked ? 'var(--signal-tension)' : 'var(--mineral-ink)')
    : (isLocked ? 'var(--signal-amber)' : 'var(--void-text-primary)');

  const frameStroke = isLightSurface
    ? (isLocked ? 'var(--signal-tension)' : 'rgba(20, 20, 19, 0.65)')
    : (isLocked ? 'var(--signal-amber)' : 'rgba(242, 239, 233, 0.45)');

  const tickStroke = isLightSurface
    ? (isLocked ? 'var(--signal-tension)' : 'var(--mineral-ink)')
    : (isLocked ? 'var(--signal-amber)' : 'var(--void-text-primary)');

  const coreDotColor = isLightSurface ? '#000000' : '#FFFFFF';

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        opacity: 0,
        transition: 'opacity 0.12s ease'
      }}
      aria-hidden="true"
    >
      {/* 1. PRIMARY RETICLE (0ms Latency 5px Crosshair) */}
      <div
        ref={reticleRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          willChange: 'transform'
        }}
      >
        {/* Horizontal Hairline */}
        <div
          style={{
            position: 'absolute',
            width: '5px',
            height: '1px',
            left: '-2px',
            top: '0px',
            backgroundColor: reticleColor,
            transition: 'background-color 0.12s ease'
          }}
        />
        {/* Vertical Hairline */}
        <div
          style={{
            position: 'absolute',
            width: '1px',
            height: '5px',
            left: '0px',
            top: '-2px',
            backgroundColor: reticleColor,
            transition: 'background-color 0.12s ease'
          }}
        />
        {/* Sub-pixel Central Core Dot */}
        <div
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            left: '0px',
            top: '0px',
            backgroundColor: coreDotColor
          }}
        />
      </div>

      {/* 2. TRAILING CALIPER FRAME (lerp: 0.18, 28px square-chamfered 1px frame with corner ticks) */}
      <div
        ref={caliperRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          willChange: 'transform'
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: `${-halfSize}px`,
            top: `${-halfSize}px`,
            width: `${frameSize}px`,
            height: `${frameSize}px`,
            transition: 'width 0.18s cubic-bezier(0.16, 1, 0.3, 1), height 0.18s cubic-bezier(0.16, 1, 0.3, 1), left 0.18s cubic-bezier(0.16, 1, 0.3, 1), top 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* SVG Chamfered Frame with Corner Ticks */}
          <svg
            width={frameSize}
            height={frameSize}
            viewBox={`0 0 ${frameSize} ${frameSize}`}
            fill="none"
            style={{ display: 'block', overflow: 'visible' }}
          >
            {/* Outer Chamfered Path */}
            <path
              d={`
                M 4 0
                H ${frameSize - 4}
                L ${frameSize} 4
                V ${frameSize - 4}
                L ${frameSize - 4} ${frameSize}
                H 4
                L 0 ${frameSize - 4}
                V 4
                Z
              `}
              stroke={frameStroke}
              strokeWidth="1"
              style={{ transition: 'stroke 0.12s ease' }}
            />

            {/* Corner Precision Ticks */}
            {/* Top-Left */}
            <line x1="0" y1="0" x2="4" y2="0" stroke={tickStroke} strokeWidth="1" style={{ transition: 'stroke 0.12s ease' }} />
            <line x1="0" y1="0" x2="0" y2="4" stroke={tickStroke} strokeWidth="1" style={{ transition: 'stroke 0.12s ease' }} />

            {/* Top-Right */}
            <line x1={frameSize - 4} y1="0" x2={frameSize} y2="0" stroke={tickStroke} strokeWidth="1" style={{ transition: 'stroke 0.12s ease' }} />
            <line x1={frameSize} y1="0" x2={frameSize} y2="4" stroke={tickStroke} strokeWidth="1" style={{ transition: 'stroke 0.12s ease' }} />

            {/* Bottom-Right */}
            <line x1={frameSize - 4} y1={frameSize} x2={frameSize} y2={frameSize} stroke={tickStroke} strokeWidth="1" style={{ transition: 'stroke 0.12s ease' }} />
            <line x1={frameSize} y1={frameSize - 4} x2={frameSize} y2={frameSize} stroke={tickStroke} strokeWidth="1" style={{ transition: 'stroke 0.12s ease' }} />

            {/* Bottom-Left */}
            <line x1="0" y1={frameSize} x2="4" y2={frameSize} stroke={tickStroke} strokeWidth="1" style={{ transition: 'stroke 0.12s ease' }} />
            <line x1="0" y1={frameSize - 4} x2="0" y2={frameSize} stroke={tickStroke} strokeWidth="1" style={{ transition: 'stroke 0.12s ease' }} />

            {/* Micro center calibration ticks when locked */}
            {isLocked && (
              <>
                <line x1={halfSize - 3} y1={halfSize} x2={halfSize + 3} y2={halfSize} stroke={isLightSurface ? 'var(--signal-tension)' : 'var(--signal-amber)'} strokeWidth="1" strokeDasharray="1 1" />
                <line x1={halfSize} y1={halfSize - 3} x2={halfSize} y2={halfSize + 3} stroke={isLightSurface ? 'var(--signal-tension)' : 'var(--signal-amber)'} strokeWidth="1" strokeDasharray="1 1" />
              </>
            )}
          </svg>

          {/* Micro Telemetry Readout Beside Cursor */}
          {isLocked && (
            <div
              style={{
                position: 'absolute',
                top: `${frameSize + 4}px`,
                left: `${halfSize - 4}px`,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '2px 7px',
                backgroundColor: isLightSurface ? 'var(--mineral-ink)' : 'var(--void-surface)',
                border: `1px solid ${isLightSurface ? 'var(--signal-tension)' : 'var(--signal-amber)'}`,
                color: isLightSurface ? 'var(--mineral-bg)' : 'var(--void-text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                lineHeight: 1.2,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                boxSizing: 'border-box'
              }}
            >
              <span ref={coordsTextRef} style={{ color: 'var(--signal-amber)' }}>
                X:0000
              </span>
              <span style={{ color: isLightSurface ? 'rgba(242, 239, 233, 0.45)' : 'var(--void-text-muted)' }}>//</span>
              <span style={{ color: isLightSurface ? 'var(--mineral-bg)' : 'var(--void-text-primary)', fontWeight: 500 }}>
                {telemetry}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
