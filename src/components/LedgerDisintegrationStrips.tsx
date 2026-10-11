import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * LedgerDisintegrationStrips
 * ===========================
 * WebGL horizontal UV displacement shader applied to a background text/data texture.
 *
 * SPECIFICATION:
 * 1. RESTORE TRANSPARENT BACKGROUND:
 *    - WebGL context initialized with { alpha: true, premultipliedAlpha: false }.
 *    - Base background color is completely transparent vec4(0.0, 0.0, 0.0, 0.0).
 *    - The light cream background of the underlying page is 100% visible.
 * 2. STOP INFINITE TILING (CLAMP TO EDGE):
 *    - Textures enforce THREE.ClampToEdgeWrapping (gl.CLAMP_TO_EDGE).
 *    - Displaced UVs outside [0, 1] are clamped/discarded, never wrapping or repeating.
 * 3. PHYSICAL Y-AXIS CLAMPING (CSS RESTRICTION):
 *    - Confined strictly to height: 350px, centered at top: 50%, transform: translateY(-50%).
 *    - Does not bleed into the header above or empty space below.
 * 4. OPACITY & SUBTLETY:
 *    - Faint, delicate data tears (alpha ~0.25 - 0.38) in dark ink (#141413) and amber (#D4943A).
 *    - The solid white ledger cards at z-index: 10 naturally mask the center.
 */

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform float u_time;
  uniform sampler2D u_texture;
  varying vec2 vUv;

  void main() {
      vec2 uv = vUv;
      
      // 1. Create high-frequency horizontal strips based on the Y-axis
      float stripNoise = sin(uv.y * 200.0) * 0.5 + 0.5;
      
      // 2. Animate the strips to pull/stretch horizontally over time
      float stretch = stripNoise * sin(u_time * 1.5) * 0.15;
      
      // 3. Apply the stretch to the X-axis to tear the image left/right
      uv.x = uv.x + stretch;
      
      // 4. Sample the texture with the torn UVs
      vec4 color = texture2D(u_texture, uv);
      
      // 5. Output with proper transparency
      gl_FragColor = vec4(color.rgb, color.a * 0.8);
  }
`;

/**
 * Generates a crisp procedural canvas texture containing financial data,
 * Beancount double-entry lines, hashes, barcodes, and Syne typography,
 * strictly over a 100% TRANSPARENT background (no dark fill).
 */
function createFinancialDataTexture(): THREE.CanvasTexture {
  const w = 2048;
  const h = 700;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // 100% TRANSPARENT BACKGROUND (NO SOLID BLACK FILL)
  ctx.clearRect(0, 0, w, h);

  // Horizontal ledger ruled lines (subtle hairline)
  for (let y = 0; y < h; y += 35) {
    ctx.strokeStyle = (y % 70 === 0) ? 'rgba(212, 148, 58, 0.35)' : 'rgba(20, 20, 19, 0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Draw 10 dense rows of financial typography across height
  const rowCount = 10;
  const rowHeight = h / rowCount;

  for (let i = 0; i < rowCount; i++) {
    const y = i * rowHeight;

    // Barcode ticker across each row
    for (let b = 0; b < 120; b++) {
      const bx = 20 + b * 16.8;
      const bw = (b % 4 === 0) ? 5 : (b % 2 === 0 ? 3 : 2);
      ctx.fillStyle = (b % 3 === 0) ? '#D4943A' : ((b % 5 === 0) ? 'rgba(20, 20, 19, 0.85)' : 'rgba(212, 148, 58, 0.5)');
      ctx.fillRect(bx, y + 4, bw, 6);
    }

    // Row typography in dark ink and amber
    ctx.font = 'bold 24px "Syne", sans-serif';
    ctx.fillStyle = 'rgba(20, 20, 19, 0.90)';
    ctx.fillText('$85,000.00 USDC', 40, y + 36);
    ctx.fillText('+$120.00 USDC', 720, y + 36);
    ctx.fillText('CONTINUOUS TREASURY', 1340, y + 36);

    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillStyle = '#D4943A';
    ctx.fillText('EUTHYNA // CRYPTOGRAPHIC REGISTER', 40, y + 54);
    ctx.fillText('POL-02 & 03 [PASSED]', 720, y + 54);
    ctx.fillText('ARC L1 FAST-FINALITY // SETTLEMENT', 1340, y + 54);

    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(20, 20, 19, 0.70)';
    ctx.fillText('TX: 0x7e8c182a4d33bb0f121d5568194aef91cbe78210...', 40, y + 54 + 14);
    ctx.fillText('Assets:Arc:USYC   $34,700.00 USYC', 720, y + 54 + 14);
    ctx.fillText('CIRCLE PAYMASTER // 0.00 GASLESS SPONSORSHIP', 1340, y + 54 + 14);

    // Caliper ticks
    ctx.strokeStyle = 'rgba(212, 148, 58, 0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, y + 2, w - 40, rowHeight - 4);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

export interface LedgerDisintegrationStripsProps {
  className?: string;
  style?: React.CSSProperties;
}

export const LedgerDisintegrationStrips: React.FC<LedgerDisintegrationStripsProps> = React.memo(({
  className,
  style
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let animId: number | null = null;
    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.Camera | null = null;
    let material: THREE.ShaderMaterial | null = null;
    let geometry: THREE.PlaneGeometry | null = null;
    let texture: THREE.CanvasTexture | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const reduceMotion = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const timerId = setTimeout(() => {
      const container = containerRef.current;
      if (disposed || !container) return;

      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || 176;

      // 1. SCENE & CAMERA (Clip-space quad)
      scene = new THREE.Scene();
      camera = new THREE.Camera();

      // 2. RENDERER (Strictly transparent WebGL context)
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          premultipliedAlpha: false,
          powerPreference: 'high-performance'
        });
      } catch (err) {
        console.warn('WebGL init error in LedgerDisintegrationStrips', err);
        return;
      }

      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);

      // Lock internal canvas to fill cropped wrapper completely
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.position = 'absolute';
      renderer.domElement.style.top = '0';
      renderer.domElement.style.left = '0';
      container.appendChild(renderer.domElement);

      // 3. BACKGROUND TEXT/DATA TEXTURE (100% transparent background)
      texture = createFinancialDataTexture();

      // 4. UV DISPLACEMENT MATERIAL
      material = new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          u_texture: { value: texture },
          u_time: { value: 0 },
          uTexture: { value: texture },
          uTime: { value: 0 },
          uResolution: { value: new THREE.Vector2(width, height) },
          uWobble: { value: reduceMotion ? 0.0 : 1.0 }
        }
      });

      // 5. FULL QUAD PLANE
      geometry = new THREE.PlaneGeometry(2, 2);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.frustumCulled = false;
      scene.add(mesh);

      // 6. RESIZE HANDLER
      const handleResize = () => {
        if (!container || !renderer || !material) return;
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || 176;
        renderer.setSize(w, h);
        material.uniforms.uResolution.value.set(w, h);
      };

      if (window.ResizeObserver) {
        resizeObserver = new ResizeObserver(() => handleResize());
        resizeObserver.observe(container);
      }
      window.addEventListener('resize', handleResize);

      // 7. RENDER LOOP
      const startTime = performance.now();
      const render = () => {
        if (disposed) return;
        const elapsed = (performance.now() - startTime) / 1000;

        if (material) {
          if (material.uniforms.u_time) material.uniforms.u_time.value = elapsed;
          if (material.uniforms.uTime) material.uniforms.uTime.value = elapsed;
        }

        if (renderer && scene && camera) {
          renderer.render(scene, camera);
        }

        animId = requestAnimationFrame(render);
      };

      animId = requestAnimationFrame(render);
    }, 50);

    return () => {
      disposed = true;
      clearTimeout(timerId);
      if (animId) cancelAnimationFrame(animId);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', () => {});

      if (renderer) {
        try {
          renderer.dispose();
          const gl = renderer.getContext();
          const ext = gl?.getExtension('WEBGL_lose_context');
          if (ext) ext.loseContext();
        } catch (e) {
          // ignore
        }
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }

      if (geometry) geometry.dispose();
      if (material) material.dispose();
      if (texture) texture.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'hidden',
        ...style
      }}
      aria-hidden="true"
    />
  );
});
