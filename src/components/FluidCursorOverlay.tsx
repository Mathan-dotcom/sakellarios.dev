import React, { useEffect, useRef } from 'react';
import WebGLFluid from 'webgl-fluid';

/**
 * FluidCursorOverlay
 *
 * Isolated WebGL fluid cursor overlay (Bleibtgleich style) running on a dedicated
 * HTML <canvas> with full transparency and strictly non-blocking pointer events.
 *
 * Aesthetic Profile:
 * - Institutional & Monochromatic: Calibrated amber (#D4943A) matching Arc L1 design tokens.
 * - Viscous Water Dynamics: Low velocity, rapid density dissipation (fade), and radius ~0.2.
 * - 100% Isolated: Zero interference with Three.js canvases or UI click interactions.
 */
export const FluidCursorOverlay: React.FC = React.memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isInitializedRef.current) return;

    // Check WebGL availability before mounting solver
    try {
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        console.warn('FluidCursorOverlay: WebGL context unavailable in current runtime.');
        return;
      }
    } catch {
      return;
    }

    try {
      WebGLFluid(canvas, {
        IMMEDIATE: false, // Prevent jarring random initial splats
        TRIGGER: 'hover', // Continuous cursor tracking
        AUTO: false, // No recurring background bursts
        INTERVAL: 0,
        SIM_RESOLUTION: 128, // Crisp simulation grid
        DYE_RESOLUTION: 1024, // High-fidelity dye buffer
        CAPTURE_RESOLUTION: 512,
        DENSITY_DISSIPATION: 3.5, // High dissipation: fades quickly and cleanly
        VELOCITY_DISSIPATION: 2.2, // Rapid velocity damping: mimics thick, viscous water ripple
        PRESSURE: 0.8,
        PRESSURE_ITERATIONS: 20,
        CURL: 4, // Low vorticity to eliminate chaotic smoke vortexes
        SPLAT_RADIUS: 0.2, // Calibrated ~0.2 water droplet spread
        SPLAT_FORCE: 3800, // Controlled impulse for fluid displacement
        SPLAT_COUNT: 1,
        SHADING: true, // Specular 3D fluid surface shading
        COLORFUL: false, // Strictly NO rainbow cycle
        COLOR_UPDATE_SPEED: 0,
        PAUSED: false,
        BACK_COLOR: { r: 0, g: 0, b: 0 },
        TRANSPARENT: true, // Completely transparent background
        BLOOM: false, // Disabled to prevent dither grain on transparent backing
        SUNRAYS: false, // Clean institutional finish without volumetric glare
        SPLAT_COLOR: { r: 0.83, g: 0.58, b: 0.23 }, // Monochromatic calibrated amber (--signal-amber)
      });

      isInitializedRef.current = true;
    } catch (err) {
      console.error('FluidCursorOverlay initialization failed:', err);
      return;
    }

    // Since the canvas has `pointer-events: none` to never intercept clicks or UI interactions,
    // we forward window pointermove/touchmove events directly to the canvas element.
    const forwardPointerMove = (clientX: number, clientY: number) => {
      if (!canvasRef.current) return;
      const event = new MouseEvent('mousemove', {
        clientX,
        clientY,
        bubbles: false,
        cancelable: true,
      });

      try {
        Object.defineProperty(event, 'offsetX', { get: () => clientX });
        Object.defineProperty(event, 'offsetY', { get: () => clientY });
      } catch {
        // Fallback for strict environments
      }

      canvasRef.current.dispatchEvent(event);
    };

    const handlePointerMove = (e: PointerEvent) => {
      forwardPointerMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        forwardPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="fluid-cursor-overlay-canvas"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9998,
        pointerEvents: 'none',
        display: 'block',
      }}
      aria-hidden="true"
    />
  );
});

FluidCursorOverlay.displayName = 'FluidCursorOverlay';
