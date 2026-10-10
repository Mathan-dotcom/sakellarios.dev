import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getScrollVelocity } from '../core/SmoothScroll';

gsap.registerPlugin(ScrollTrigger);

export interface OpticalGovernorCanvasProps {
  isHalted: boolean;
  bootProgressRef?: React.MutableRefObject<number>;
}

export const OpticalGovernorCanvas: React.FC<OpticalGovernorCanvasProps> = React.memo(({ isHalted, bootProgressRef }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const scrollProgressRef = useRef(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let animationFrameId: number;
    const width = mount.clientWidth || window.innerWidth;
    const height = mount.clientHeight || window.innerHeight;

    // 1. SCENE & CAMERA
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.2);

    // 2. RENDERER
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
    mount.appendChild(renderer.domElement);

    // 3. BACKDROP RADIAL GLSL EMISSION PLANE
    // Emits calibrated amber (#D4943A) when nominal, shifting to burnt orange (#C84B31) during tension
    const backdropUniforms = {
      uTime: { value: 0.0 },
      uTension: { value: isHalted ? 1.0 : 0.0 },
      uScrollVelocity: { value: 0.0 },
      uResolution: { value: new THREE.Vector2(width, height) }
    };

    const backdropVertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const backdropFragmentShader = `
      uniform float uTime;
      uniform float uTension;
      varying vec2 vUv;

      void main() {
        vec2 center = vec2(0.5, 0.5);
        float d = distance(vUv, center);

        // Colors from Canonical DESIGN.md
        // Amber: #D4943A -> vec3(0.831, 0.580, 0.227)
        // Tension: #C84B31 -> vec3(0.784, 0.294, 0.192)
        vec3 colAmber = vec3(0.831, 0.580, 0.227);
        vec3 colTension = vec3(0.784, 0.294, 0.192);
        vec3 baseColor = mix(colAmber, colTension, uTension);

        // Deterministic Gaussian Radial Falloff
        float pulse = 1.0 + 0.06 * sin(uTime * 1.8);
        float intensity = exp(-pow(d * 3.2, 2.0)) * 0.42 * pulse;

        // Subtle concentric CAD interference rings
        float ringPattern = sin(d * 90.0 - uTime * 0.5) * 0.035;
        intensity += max(0.0, ringPattern * (1.0 - smoothstep(0.1, 0.5, d)));

        gl_FragColor = vec4(baseColor, intensity);
      }
    `;

    const backdropGeo = new THREE.PlaneGeometry(8, 8);
    const backdropMat = new THREE.ShaderMaterial({
      vertexShader: backdropVertexShader,
      fragmentShader: backdropFragmentShader,
      uniforms: backdropUniforms,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false
    });
    const backdropMesh = new THREE.Mesh(backdropGeo, backdropMat);
    backdropMesh.position.z = -1.2;
    scene.add(backdropMesh);

    // 4. BESPOKE STIPPLED POINT-CLOUD CORE (4,600+ Vertices)
    // Precision spherical/toroidal governor matrix with calibrated particle size attenuation
    const pointCount = 4600;
    const positions = new Float32Array(pointCount * 3);
    const colors = new Float32Array(pointCount * 3);
    const sizes = new Float32Array(pointCount);

    const amberRGB = new THREE.Color('#D4943A');
    const boneRGB = new THREE.Color('#F2EFE9');

    let idx = 0;
    // Layer 1: Core Fibonacci Sphere (2,200 points)
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle
    for (let i = 0; i < 2200; i++) {
      const y = 1 - (i / (2200 - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const r = 0.95 + 0.12 * Math.sin(i * 0.2);
      positions[idx * 3] = Math.cos(theta) * radiusAtY * r;
      positions[idx * 3 + 1] = y * r;
      positions[idx * 3 + 2] = Math.sin(theta) * radiusAtY * r;

      const c = i % 7 === 0 ? boneRGB : amberRGB;
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;

      sizes[idx] = i % 11 === 0 ? 2.6 : 1.5;
      idx++;
    }

    // Layer 2: Toroidal Precision Stabilizer (1,600 points)
    for (let i = 0; i < 1600; i++) {
      const u = (i / 1600) * Math.PI * 2;
      const v = ((i * 13) % 1600 / 1600) * Math.PI * 2;
      const R = 1.48; // Major radius
      const r = 0.28; // Minor radius

      positions[idx * 3] = (R + r * Math.cos(v)) * Math.cos(u);
      positions[idx * 3 + 1] = (R + r * Math.cos(v)) * Math.sin(u) * 0.35;
      positions[idx * 3 + 2] = r * Math.sin(v);

      const c = i % 4 === 0 ? boneRGB : amberRGB;
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;

      sizes[idx] = 1.35;
      idx++;
    }

    // Layer 3: Cardinal Orthographic Alignment Shell (800 points)
    for (let i = 0; i < 800; i++) {
      const angle = (i / 800) * Math.PI * 2;
      const ringR = 2.05 + 0.08 * ((i % 5) - 2);

      positions[idx * 3] = Math.cos(angle) * ringR;
      positions[idx * 3 + 1] = (Math.sin(angle) * ringR) * 0.15;
      positions[idx * 3 + 2] = Math.sin(angle * 2) * 0.18;

      colors[idx * 3] = boneRGB.r;
      colors[idx * 3 + 1] = boneRGB.g;
      colors[idx * 3 + 2] = boneRGB.b;

      sizes[idx] = i % 8 === 0 ? 2.2 : 1.1;
      idx++;
    }

    const cloudGeo = new THREE.BufferGeometry();
    cloudGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    cloudGeo.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    cloudGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const cloudUniforms = {
      uTime: { value: 0.0 },
      uTension: { value: isHalted ? 1.0 : 0.0 },
      uScrollVelocity: { value: 0.0 },
      uBootProgress: { value: bootProgressRef ? bootProgressRef.current : 1.0 }
    };

    const cloudVertexShader = `
      attribute float size;
      attribute vec3 customColor;
      varying vec3 vColor;
      uniform float uTime;
      uniform float uTension;
      uniform float uScrollVelocity;
      uniform float uBootProgress;

      void main() {
        vColor = customColor;
        if (uTension > 0.05) {
          vColor = mix(vColor, vec3(0.784, 0.294, 0.192), uTension * 0.65);
        }

        // 1. Dispersion during instrument boot convergence (0.0 -> 1.0)
        float boot = clamp(uBootProgress, 0.0, 1.0);
        float dispersion = (1.0 - boot) * 3.4;
        vec3 radialOffset = normalize(position + vec3(0.0001)) * (dispersion * (1.0 + 0.3 * sin(position.y * 5.0 + position.x * 3.0)));
        vec3 pos = position + radialOffset;

        // 2. 100% GPU vertex wave undulation driven by uTime & uScrollVelocity
        float r = length(pos);
        float wave = sin(r * 4.2 - uTime * 2.0 + pos.y * 3.0) * (0.038 * boot);
        float velPulse = sin(pos.x * 5.0 + uTime * 3.5) * (uScrollVelocity * 0.035);
        vec3 dir = normalize(pos + vec3(0.0001));
        pos += dir * (wave + velPulse);

        // 3. Projected position (vertices completely ignore cursor)
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        float pointScale = 290.0 / -mvPosition.z;
        gl_PointSize = size * pointScale * (1.0 + min(0.35, abs(uScrollVelocity) * 0.12));
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const cloudFragmentShader = `
      varying vec3 vColor;
      void main() {
        float d = distance(gl_PointCoord, vec2(0.5));
        if (d > 0.5) discard;
        float alpha = smoothstep(0.5, 0.25, d) * 0.92;
        gl_FragColor = vec4(vColor, alpha);
      }
    `;

    const cloudMat = new THREE.ShaderMaterial({
      vertexShader: cloudVertexShader,
      fragmentShader: cloudFragmentShader,
      uniforms: cloudUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    const pointCloud = new THREE.Points(cloudGeo, cloudMat);

    // 5. THREE CONCENTRIC ORTHOGRAPHIC CAD MEASUREMENT RINGS
    // Higher precision CAD ring generator with 240 circular steps and calibrated ticks
    const createCADRing = (radius: number, tickCount: number, tickInner: number, tickOuter: number) => {
      const segments: number[] = [];
      const circleSteps = 240;

      // Outer Perimeter Line Loop
      for (let i = 0; i < circleSteps; i++) {
        const a1 = (i / circleSteps) * Math.PI * 2;
        const a2 = ((i + 1) / circleSteps) * Math.PI * 2;
        segments.push(Math.cos(a1) * radius, Math.sin(a1) * radius, 0);
        segments.push(Math.cos(a2) * radius, Math.sin(a2) * radius, 0);
      }

      // Radial Calibration Ticks
      for (let i = 0; i < tickCount; i++) {
        const angle = (i / tickCount) * Math.PI * 2;
        const isCardinal = i % (tickCount / 4) === 0;
        const isMajor = i % 4 === 0;
        const tInner = isCardinal ? tickInner * 2.2 : (isMajor ? tickInner * 1.5 : tickInner);
        const tOuter = isCardinal ? tickOuter * 2.5 : (isMajor ? tickOuter * 1.6 : tickOuter);

        const r1 = radius - tInner;
        const r2 = radius + tOuter;

        segments.push(Math.cos(angle) * r1, Math.sin(angle) * r1, 0);
        segments.push(Math.cos(angle) * r2, Math.sin(angle) * r2, 0);
      }

      const ringGeo = new THREE.BufferGeometry();
      ringGeo.setAttribute('position', new THREE.Float32BufferAttribute(segments, 3));
      return ringGeo;
    };

    // A. OUTER DATUM RING (400K FLOOR) — 120 calibration ticks
    const outerDatumRingGeo = createCADRing(2.35, 120, 0.05, 0.06);
    const earSegments: number[] = [];
    earSegments.push(2.35, 0, 0, 3.4, 0, 0);
    earSegments.push(-2.35, 0, 0, -3.4, 0, 0);
    const earGeo = new THREE.BufferGeometry();
    earGeo.setAttribute('position', new THREE.Float32BufferAttribute(earSegments, 3));

    const outerDatumRingMat = new THREE.LineBasicMaterial({
      color: 0xF2EFE9,
      transparent: true,
      opacity: 0.78
    });
    const outerDatumRing = new THREE.LineSegments(outerDatumRingGeo, outerDatumRingMat);
    const datumEars = new THREE.LineSegments(earGeo, outerDatumRingMat);
    outerDatumRing.add(datumEars);

    // B. INNER KINETIC RING 1 (80 calibration ticks, rotating 0.08 rad/s)
    const kineticRing1Geo = createCADRing(1.82, 80, 0.04, 0.05);
    const kineticRing1Mat = new THREE.LineBasicMaterial({
      color: 0xD4943A,
      transparent: true,
      opacity: 0.85
    });
    const kineticRing1 = new THREE.LineSegments(kineticRing1Geo, kineticRing1Mat);
    kineticRing1.rotation.x = THREE.MathUtils.degToRad(32);

    // C. INNER KINETIC RING 2 (60 calibration ticks, rotating -0.06 rad/s)
    const kineticRing2Geo = createCADRing(1.28, 60, 0.03, 0.04);
    const kineticRing2Mat = new THREE.LineBasicMaterial({
      color: 0xF2EFE9,
      transparent: true,
      opacity: 0.6
    });
    const kineticRing2 = new THREE.LineSegments(kineticRing2Geo, kineticRing2Mat);
    kineticRing2.rotation.y = THREE.MathUtils.degToRad(-26);

    // INSTRUMENT ASSEMBLY GROUP (for unified mouse parallax tilt)
    const instrumentGroup = new THREE.Group();
    instrumentGroup.add(pointCloud);
    instrumentGroup.add(outerDatumRing);
    instrumentGroup.add(kineticRing1);
    instrumentGroup.add(kineticRing2);
    scene.add(instrumentGroup);

    // MOUSE PARALLAX TRACKER (lerp: 0.05) & CURSOR NDC FIELD
    let targetTiltX = 0;
    let targetTiltY = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;

    const handlePointerMove = (e: PointerEvent) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;
      targetTiltX = -normY * 0.16; // subtle pitch tilt
      targetTiltY = normX * 0.22;  // subtle yaw tilt
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    // 6. SCROLLTRIGGER COUPLING
    const scrollTriggerInstance = ScrollTrigger.create({
      trigger: mount,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        scrollProgressRef.current = self.progress;
      }
    });

    // 7. RENDER & SIMULATION LOOP
    let currentTension = isHalted ? 1.0 : 0.0;
    const targetTension = isHalted ? 1.0 : 0.0;
    const startTime = performance.now();
    let lastTime = startTime;
    let smoothVelocity = 0;

    const animate = () => {
      const now = performance.now();
      const elapsedTime = (now - startTime) / 1000;
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Smooth tension interpolation
      currentTension += (targetTension - currentTension) * 0.06;
      backdropUniforms.uTension.value = currentTension;
      backdropUniforms.uTime.value = elapsedTime;
      cloudUniforms.uTension.value = currentTension;
      cloudUniforms.uTime.value = elapsedTime;

      // Boot progress uniform & CAD ring spin-down physics
      const bootProgress = bootProgressRef ? bootProgressRef.current : 1.0;
      cloudUniforms.uBootProgress.value = bootProgress;
      const bootRingBoost = Math.max(0, 1.0 - bootProgress) * 4.2;

      // Scroll velocity dynamics
      const rawVelocity = getScrollVelocity();
      smoothVelocity += (rawVelocity - smoothVelocity) * 0.08;
      const speedBoost = Math.min(2.5, Math.abs(smoothVelocity) * 0.18);

      cloudUniforms.uScrollVelocity.value = smoothVelocity;
      backdropUniforms.uScrollVelocity.value = smoothVelocity;

      // Accelerated rotation speed during scroll & boot spin-down lock
      kineticRing1.rotation.z += (0.08 + speedBoost * 0.35 + bootRingBoost) * (delta || 0.016);
      kineticRing2.rotation.z -= (0.06 + speedBoost * 0.30 + bootRingBoost * 0.75) * (delta || 0.016);

      // Point cloud deterministic orbit
      pointCloud.rotation.y = elapsedTime * 0.04;
      pointCloud.rotation.x = Math.sin(elapsedTime * 0.02) * 0.08;

      // Subtle mouse-parallax tilt physics (lerp: 0.05)
      currentTiltX += (targetTiltX - currentTiltX) * 0.05;
      currentTiltY += (targetTiltY - currentTiltY) * 0.05;

      // Scroll progress coupling with camera Z-perspective shift
      const p = scrollProgressRef.current;
      camera.position.z = 5.2 - p * 1.4 - Math.min(0.3, Math.abs(smoothVelocity) * 0.025);
      const scrollPitch = p * THREE.MathUtils.degToRad(35);

      instrumentGroup.rotation.x = currentTiltX + scrollPitch * 0.5;
      instrumentGroup.rotation.y = currentTiltY;

      kineticRing1.rotation.x = THREE.MathUtils.degToRad(32) + scrollPitch * 0.5;
      kineticRing2.rotation.y = THREE.MathUtils.degToRad(-26) - scrollPitch * 0.5;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    // 8. INTERSECTION OBSERVER: PAUSE WEBGL WHEN VIEWPORT 01 IS OFF-SCREEN
    let isVisible = true;
    let isLoopRunning = false;

    const startLoop = () => {
      if (!isLoopRunning && isVisible) {
        isLoopRunning = true;
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    const stopLoop = () => {
      isLoopRunning = false;
      cancelAnimationFrame(animationFrameId);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          startLoop();
        } else {
          stopLoop();
        }
      },
      { threshold: 0.02 }
    );

    observer.observe(mount);
    startLoop();

    // 9. RESIZE LISTENER
    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
      backdropUniforms.uResolution.value.set(w, h);
    };

    window.addEventListener('resize', handleResize);

    // CLEANUP
    return () => {
      observer.disconnect();
      stopLoop();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      cancelAnimationFrame(animationFrameId);
      scrollTriggerInstance.kill();

      backdropGeo.dispose();
      backdropMat.dispose();
      cloudGeo.dispose();
      cloudMat.dispose();
      outerDatumRingGeo.dispose();
      outerDatumRingMat.dispose();
      earGeo.dispose();
      kineticRing1Geo.dispose();
      kineticRing1Mat.dispose();
      kineticRing2Geo.dispose();
      kineticRing2Mat.dispose();

      renderer.dispose();
      if (renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [isHalted]);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1
      }}
    />
  );
});
