import React, { Component, ErrorInfo, ReactNode, useEffect, useRef } from 'react';

/**
 * BleibtgleichCursorOverlay
 *
 * Reverse-engineered WebGL fluid refraction cursor overlay directly extracted from
 * the Bleibtgleich portfolio architecture (https://bleibtgleich.dev / 62015.js).
 *
 * Architectural Scoping Profile:
 * - Scoped strictly to the Hero container with position: absolute; width: 100%; height: 100%.
 * - Relative coordinate calculation based on the local Hero bounding box.
 * - Stops tracking and rendering when cursor scrolls/moves outside the Hero viewport.
 * - Specular highlight subtly tinted with Arc L1 calibrated amber (#D4943A).
 * - Layered with zIndex: 5 (above 3D OpticalGovernorCanvas, underneath Hero typography at zIndex: 10+).
 */

const VS_QUAD = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
out vec2 vUv;
void main () {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FS_SPLAT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uField;
uniform float aspectRatio;
uniform vec3 color;
uniform vec2 point;
uniform float radius;

void main () {
  vec2 p = vUv - point;
  p.x *= aspectRatio;
  float g = exp(-dot(p, p) / radius);
  vec4 f = texture(uField, vUv);
  float w = clamp(g * color.x, 0.0, 1.0);
  fragColor = vec4(
    f.r + g * color.x,
    mix(f.g, color.y, w),
    mix(f.b, color.z, w),
    1.0
  );
}
`;

const FS_SIM = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uField;
uniform vec2 texelSize;
uniform float dt;
uniform float friction;
uniform float spread;
uniform float decay;
uniform float wobble;
uniform float grain;
uniform float time;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  return noise(p) * 0.55 + noise(p * 2.6) * 0.3 + noise(p * 6.3) * 0.15;
}

void main () {
  vec2 vel = texture(uField, vUv).gb;
  vec2 coord = vUv - vel * dt;
  vec4 s = texture(uField, coord);

  float t = time * 0.3;
  vec2 warp = (vec2(
    fbm(vUv * 11.0 + t),
    fbm(vUv * 11.0 + 37.2 - t)
  ) - 0.5) * 2.0 * wobble * texelSize;

  vec4 nL = texture(uField, coord + vec2(-texelSize.x, 0.0) + warp);
  vec4 nR = texture(uField, coord + vec2( texelSize.x, 0.0) + warp);
  vec4 nT = texture(uField, coord + vec2(0.0,  texelSize.y) + warp);
  vec4 nB = texture(uField, coord + vec2(0.0, -texelSize.y) + warp);
  float avgD = (nL.r + nR.r + nT.r + nB.r) * 0.25;
  vec2 avgV = (nL.gb + nR.gb + nT.gb + nB.gb) * 0.25;

  float d = mix(s.r, avgD, spread);
  vec2 v = mix(s.gb, avgV, spread * 0.5);

  float g = fbm(vUv * 15.0 + 5.1 + t * 0.6);
  d *= 1.0 / (1.0 + (decay + grain * decay * (g - 0.5) * 2.0) * dt);
  v *= 1.0 / (1.0 + friction * dt);

  fragColor = vec4(max(d, 0.0), v, 1.0);
}
`;

const FS_RENDER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uField;
uniform vec2 texelSize;
uniform float time;

void main () {
  vec4 field = texture(uField, vUv);
  float d = field.r;
  vec2 vel = field.gb;

  // Solid dark background matching app void theme (#0A0A09)
  vec3 baseColor = vec3(10.0 / 255.0, 10.0 / 255.0, 9.0 / 255.0);

  // Quiescent state: Output solid dark background to visually hide the 3D Governor
  if (d < 0.0001 && length(vel) < 0.0001) {
    fragColor = vec4(baseColor, 1.0);
    return;
  }

  // Fluid density driving the viscous reveal tear
  float fluidDensity = clamp(d + length(vel) * 0.25, 0.0, 1.0);

  // Sharp water meniscus alpha tear calculation
  float fluidEdge = smoothstep(0.02, 0.06, fluidDensity);

  // Sharp silvery-water edge glint simulating high surface tension
  vec3 edgeGlint = vec3(0.95, 0.98, 1.0) * smoothstep(0.01, 0.03, fluidDensity) * (1.0 - smoothstep(0.03, 0.06, fluidDensity));

  fragColor = vec4(baseColor + (edgeGlint * 1.5), 1.0 - fluidEdge);
}
`;

interface ShaderProgram {
  p: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation>;
}

interface FramebufferTarget {
  tex: WebGLTexture;
  fbo: WebGLFramebuffer;
  w: number;
  h: number;
  attach: (slot: number) => number;
}

export interface BleibtgleichCursorOverlayProps {
  style?: React.CSSProperties;
  zIndex?: number;
}

/**
 * Isolated Canvas Component Scoped to Local Container
 */
const BleibtgleichCursorCanvas: React.FC<BleibtgleichCursorOverlayProps> = ({
  style,
  zIndex = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isMounted = true;
    let animFrameId: number | null = null;

    // Initialize WebGL2 context safely with DOM transparency enabled (premultipliedAlpha: false)
    let gl: WebGL2RenderingContext | null = null;
    try {
      gl = canvas.getContext('webgl2', {
        alpha: true,
        premultipliedAlpha: false,
        antialias: false,
        depth: false,
        stencil: false,
      });
    } catch {
      return;
    }

    if (!gl || gl.isContextLost()) {
      return;
    }

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
    canvas.addEventListener('webglcontextlost', handleContextLost, { passive: false });

    gl.getExtension('EXT_color_buffer_float');
    const filterType = gl.getExtension('OES_texture_float_linear') ? gl.LINEAR : gl.NEAREST;

    // Helper: compile shader safely
    const compileShader = (type: number, src: string): WebGLShader | null => {
      if (!gl || gl.isContextLost()) return null;
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, src.trim());
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        console.warn('Bleibtgleich shader compilation warning:', info);
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    // Helper: create program with mapped uniform locations
    const createProgram = (vertShader: WebGLShader, fragSrc: string): ShaderProgram | null => {
      if (!gl || gl.isContextLost()) return null;
      const fragShader = compileShader(gl.FRAGMENT_SHADER, fragSrc);
      if (!fragShader) return null;

      const prog = gl.createProgram();
      if (!prog) {
        gl.deleteShader(fragShader);
        return null;
      }

      gl.attachShader(prog, vertShader);
      gl.attachShader(prog, fragShader);
      gl.linkProgram(prog);

      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.warn('Bleibtgleich program link warning:', gl.getProgramInfoLog(prog));
        gl.deleteProgram(prog);
        gl.deleteShader(fragShader);
        return null;
      }

      const uniforms: Record<string, WebGLUniformLocation> = {};
      const count = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < count; i++) {
        const uniformInfo = gl.getActiveUniform(prog, i);
        if (uniformInfo) {
          const loc = gl.getUniformLocation(prog, uniformInfo.name);
          if (loc) uniforms[uniformInfo.name] = loc;
        }
      }

      gl.deleteShader(fragShader);
      return { p: prog, uniforms };
    };

    let vertShader: WebGLShader | null = null;
    let splatProgram: ShaderProgram | null = null;
    let simProgram: ShaderProgram | null = null;
    let renderProgram: ShaderProgram | null = null;

    try {
      vertShader = compileShader(gl.VERTEX_SHADER, VS_QUAD);
      if (!vertShader) return;

      splatProgram = createProgram(vertShader, FS_SPLAT);
      simProgram = createProgram(vertShader, FS_SIM);
      renderProgram = createProgram(vertShader, FS_RENDER);

      if (!splatProgram || !simProgram || !renderProgram) {
        return;
      }
    } catch (err) {
      console.warn('Bleibtgleich shader initialization caught safely:', err);
      return;
    }

    // Geometry Quad buffer
    const vao = gl.createVertexArray();
    if (!vao) return;
    gl.bindVertexArray(vao);

    const quadBuffer = gl.createBuffer();
    if (!quadBuffer) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // Framebuffer target generator for half-float simulation textures
    const createFBO = (w: number, h: number): FramebufferTarget | null => {
      if (!gl || gl.isContextLost()) return null;
      try {
        const tex = gl.createTexture();
        if (!tex) return null;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filterType);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filterType);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);

        const fbo = gl.createFramebuffer();
        if (!fbo) {
          gl.deleteTexture(tex);
          return null;
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
          gl.deleteFramebuffer(fbo);
          gl.deleteTexture(tex);
          return null;
        }

        gl.viewport(0, 0, w, h);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        return {
          tex,
          fbo,
          w,
          h,
          attach(slot: number) {
            gl.activeTexture(gl.TEXTURE0 + slot);
            gl.bindTexture(gl.TEXTURE_2D, tex);
            return slot;
          },
        };
      } catch {
        return null;
      }
    };

    // Bleibtgleich Revealer Shroud Parameters — Viscous Water Profile
    const BASE_SIM_RES = 512;
    const MAX_SIM_RES = 1440;
    const VELOCITY_FACTOR = 1.35;
    const FRICTION = 4.2;
    const SPREAD = 0.35;
    const DECAY = 4.8;           // Fast decay so the fluid wake closes quickly behind the cursor
    const SPLAT_RADIUS = 0.0025; // Tight, precise reveal footprint
    const DENSITY_IMPULSE = 1.5; // Controlled impulse preventing outward bleeding
    const WOBBLE = 0.6;
    const GRAIN = 0.20;
    const MAX_VELOCITY = 3.6;

    let fboRead: FramebufferTarget | null = null;
    let fboWrite: FramebufferTarget | null = null;
    let texelX = 1 / BASE_SIM_RES;
    let texelY = 1 / BASE_SIM_RES;

    const pingPong = {
      get read() {
        return fboRead;
      },
      get write() {
        return fboWrite;
      },
      swap() {
        const tmp = fboRead;
        fboRead = fboWrite;
        fboWrite = tmp;
      },
    };

    const updateFBOSize = () => {
      if (!gl || gl.isContextLost()) return;
      const aspect = canvas.width / Math.max(canvas.height, 1);
      let targetW: number;
      let targetH: number;
      if (aspect >= 1) {
        targetH = BASE_SIM_RES;
        targetW = Math.min(Math.round(BASE_SIM_RES * aspect), MAX_SIM_RES);
      } else {
        targetW = BASE_SIM_RES;
        targetH = Math.min(Math.round(BASE_SIM_RES / aspect), MAX_SIM_RES);
      }

      if (fboRead && fboRead.w === targetW && fboRead.h === targetH) return;

      if (fboRead) {
        gl.deleteTexture(fboRead.tex);
        gl.deleteFramebuffer(fboRead.fbo);
      }
      if (fboWrite) {
        gl.deleteTexture(fboWrite.tex);
        gl.deleteFramebuffer(fboWrite.fbo);
      }

      fboRead = createFBO(targetW, targetH);
      fboWrite = createFBO(targetW, targetH);
      texelX = 1 / targetW;
      texelY = 1 / targetH;
    };

    const drawQuad = (target: FramebufferTarget | null) => {
      if (!gl || gl.isContextLost()) return;
      if (vao) gl.bindVertexArray(vao);
      if (target) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
        gl.viewport(0, 0, target.w, target.h);
      } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    // Cursor tracking state
    const cursor = {
      x: 0.5,
      y: 0.5,
      px: 0.5,
      py: 0.5,
      vx: 0,
      vy: 0,
      moved: false,
      init: false,
    };

    let prevTime = performance.now();
    let prevMoveTime = performance.now();

    const applySplat = (x: number, y: number, density: number, vx: number, vy: number) => {
      if (!gl || gl.isContextLost() || !splatProgram || !pingPong.read || !pingPong.write) return;
      gl.useProgram(splatProgram.p);
      gl.uniform1i(splatProgram.uniforms.uField, pingPong.read.attach(0));
      gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height);
      gl.uniform2f(splatProgram.uniforms.point, x, y);
      gl.uniform3f(splatProgram.uniforms.color, density, vx, vy);
      gl.uniform1f(splatProgram.uniforms.radius, SPLAT_RADIUS);
      drawQuad(pingPong.write);
      pingPong.swap();
    };

    // Sub-sample cursor path to ensure continuous, unbroken fluid wake
    const interpolateSplats = () => {
      const aspect = canvas.width / Math.max(canvas.height, 1);
      const vx = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, cursor.vx)) * VELOCITY_FACTOR;
      const vy = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, cursor.vy)) * VELOCITY_FACTOR;
      const dist = Math.hypot((cursor.x - cursor.px) * aspect, cursor.y - cursor.py);
      const steps = Math.max(1, Math.ceil(dist / (0.35 * Math.sqrt(SPLAT_RADIUS))));

      for (let i = 0; i < steps; i++) {
        const factor = steps === 1 ? 1 : i / (steps - 1);
        applySplat(
          cursor.px + (cursor.x - cursor.px) * factor,
          cursor.py + (cursor.y - cursor.py) * factor,
          DENSITY_IMPULSE,
          vx,
          vy
        );
      }
    };

    // Track mouse coordinates strictly relative to this local Hero container
    const recordPointerCoords = (clientX: number, clientY: number) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      if (rect.width <= 0 || rect.height <= 0) return;

      // If cursor is outside the Hero container bounds, stop tracking
      if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
        if (cursor.init) {
          cursor.init = false;
          cursor.moved = false;
        }
        return;
      }

      const now = performance.now();
      const dt = Math.max((now - prevMoveTime) / 1000, 0.004);
      prevMoveTime = now;

      // Local normalized coordinates (0 to 1) relative to this specific canvas
      const normX = x / rect.width;
      const normY = 1 - (y / rect.height);

      if (!cursor.init) {
        cursor.px = normX;
        cursor.py = normY;
        cursor.x = normX;
        cursor.y = normY;
        cursor.vx = 0;
        cursor.vy = 0;
        cursor.init = true;
        cursor.moved = true;
        return;
      }

      cursor.px = cursor.x;
      cursor.py = cursor.y;
      cursor.vx = (normX - cursor.px) / dt;
      cursor.vy = (normY - cursor.py) / dt;
      cursor.x = normX;
      cursor.y = normY;
      cursor.moved = true;
    };

    const handlePointerMove = (e: PointerEvent | MouseEvent) => {
      recordPointerCoords(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        recordPointerCoords(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleMouseLeave = () => {
      cursor.init = false;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);

    const resize = () => {
      if (!canvas || !gl || gl.isContextLost()) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        updateFBOSize();
      }
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    // ResizeObserver for dynamic container resizes
    let ro: ResizeObserver | null = null;
    try {
      ro = new ResizeObserver(() => {
        resize();
      });
      ro.observe(canvas);
    } catch {
      // Fallback to window resize
    }

    // Main GPGPU Simulation & Refractive Rendering RAF Loop
    const loop = () => {
      if (!isMounted) return;
      animFrameId = requestAnimationFrame(loop);

      if (!gl || gl.isContextLost() || !fboRead || !fboWrite || !simProgram || !renderProgram) {
        return;
      }

      const now = performance.now();
      const dt = Math.min((now - prevTime) / 1000, 0.033);
      prevTime = now;

      try {
        gl.disable(gl.BLEND);

        // 1. Splat impulse injection along cursor path
        if (cursor.moved) {
          interpolateSplats();
          cursor.moved = false;
        }

        // 2. Physics Simulation Pass: Advection, FBM Wobble, Diffusion, Grain Decay
        if (pingPong.read && pingPong.write) {
          gl.useProgram(simProgram.p);
          gl.uniform2f(simProgram.uniforms.texelSize, texelX, texelY);
          gl.uniform1f(simProgram.uniforms.dt, dt);
          gl.uniform1f(simProgram.uniforms.friction, FRICTION);
          gl.uniform1f(simProgram.uniforms.spread, SPREAD);
          gl.uniform1f(simProgram.uniforms.decay, DECAY);
          gl.uniform1f(simProgram.uniforms.wobble, WOBBLE);
          gl.uniform1f(simProgram.uniforms.grain, GRAIN);
          gl.uniform1f(simProgram.uniforms.time, 0.001 * now);
          gl.uniform1i(simProgram.uniforms.uField, pingPong.read.attach(0));
          drawQuad(pingPong.write);
          pingPong.swap();
        }

        // 3. Render Pass: Dark Shroud & Fluid Revealer Mask
        if (pingPong.read) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          gl.viewport(0, 0, canvas.width, canvas.height);
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);

          gl.disable(gl.BLEND);

          if (vao) gl.bindVertexArray(vao);
          gl.useProgram(renderProgram.p);
          gl.uniform1i(renderProgram.uniforms.uField, pingPong.read.attach(0));
          gl.uniform2f(renderProgram.uniforms.texelSize, texelX, texelY);
          gl.uniform1f(renderProgram.uniforms.time, 0.001 * now);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
      } catch {
        // Silent recovery to prevent unhandled frame crash
      }
    };

    loop();

    return () => {
      isMounted = false;
      if (animFrameId) cancelAnimationFrame(animFrameId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', resize);
      if (ro) ro.disconnect();
      canvas.removeEventListener('webglcontextlost', handleContextLost);

      if (gl && !gl.isContextLost()) {
        try {
          if (fboRead) {
            gl.deleteTexture(fboRead.tex);
            gl.deleteFramebuffer(fboRead.fbo);
          }
          if (fboWrite) {
            gl.deleteTexture(fboWrite.tex);
            gl.deleteFramebuffer(fboWrite.fbo);
          }
          if (quadBuffer) gl.deleteBuffer(quadBuffer);
          if (vao) gl.deleteVertexArray(vao);
          if (splatProgram) gl.deleteProgram(splatProgram.p);
          if (simProgram) gl.deleteProgram(simProgram.p);
          if (renderProgram) gl.deleteProgram(renderProgram.p);
          if (vertShader) gl.deleteShader(vertShader);
        } catch {
          // Cleanup error suppression
        }
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="bleibtgleich-cursor-overlay-canvas"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex,
        pointerEvents: 'none',
        display: 'block',
        ...style,
      }}
      aria-hidden="true"
    />
  );
};

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * React Error Boundary Safety Net
 */
class BleibtgleichErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('BleibtgleichCursorOverlay safely contained by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

/**
 * Public Export wrapped in Error Boundary
 */
export const BleibtgleichCursorOverlay: React.FC<BleibtgleichCursorOverlayProps> = React.memo((props) => {
  return (
    <BleibtgleichErrorBoundary>
      <BleibtgleichCursorCanvas {...props} />
    </BleibtgleichErrorBoundary>
  );
});

BleibtgleichCursorOverlay.displayName = 'BleibtgleichCursorOverlay';
