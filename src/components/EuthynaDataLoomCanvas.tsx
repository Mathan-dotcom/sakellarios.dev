import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ProcessedInvoice } from '../core/useSakellariousEngine';
import { getScrollVelocity } from '../core/SmoothScroll';

export interface EuthynaDataLoomCanvasProps {
  invoices: ProcessedInvoice[];
  generateBeancount: (item: ProcessedInvoice) => string;
  generateJsonLd: (item: ProcessedInvoice) => string;
}

const SLAB_COUNT = 18;
const SLAB_WIDTH = 5.2;
const SLAB_HEIGHT = 1.22;
const SLAB_SPACING_Y = 1.48;

/**
 * Draws high-resolution slab face graphics onto a 2D canvas texture atlas.
 * Follows Calibrated Authority: Matte #F7F5F0 or #0D0D0C surfaces, 1px hairlines,
 * caliper corner ticks, Syne numerals, and JetBrains Mono TX hashes.
 */
function drawSlabFace(
  ctx: CanvasRenderingContext2D,
  yOffset: number,
  record: ProcessedInvoice,
  index: number
) {
  const w = 1024;
  const h = 240;

  // Background: Matte #F7F5F0 (Mineral Archive)
  ctx.fillStyle = '#F7F5F0';
  ctx.fillRect(0, yOffset, w, h);

  // 1px Hairline Perimeter Border
  ctx.strokeStyle = 'rgba(20, 20, 19, 0.28)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, yOffset + 1, w - 2, h - 2);

  // Caliper Precision Corner Ticks
  const tick = 14;
  ctx.strokeStyle = '#141413';
  ctx.lineWidth = 2;
  // Top-left
  ctx.beginPath();
  ctx.moveTo(0, yOffset + tick);
  ctx.lineTo(0, yOffset);
  ctx.lineTo(tick, yOffset);
  ctx.stroke();
  // Top-right
  ctx.beginPath();
  ctx.moveTo(w - tick, yOffset);
  ctx.lineTo(w, yOffset);
  ctx.lineTo(w, yOffset + tick);
  ctx.stroke();
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(0, yOffset + h - tick);
  ctx.lineTo(0, yOffset + h);
  ctx.lineTo(tick, yOffset + h);
  ctx.stroke();
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(w - tick, yOffset + h);
  ctx.lineTo(w, yOffset + h);
  ctx.lineTo(w, yOffset + h - tick);
  ctx.stroke();

  // Internal Vertical Datum Dividing Hairlines
  ctx.strokeStyle = 'rgba(20, 20, 19, 0.12)';
  ctx.lineWidth = 1;
  // Col 1 divider
  ctx.beginPath();
  ctx.moveTo(290, yOffset);
  ctx.lineTo(290, yOffset + h);
  ctx.stroke();
  // Col 2 divider
  ctx.beginPath();
  ctx.moveTo(680, yOffset);
  ctx.lineTo(680, yOffset + h);
  ctx.stroke();

  // --------------------------------------------------------------------------
  // COLUMN 1: EUTHYNA FOLIO & STATUS
  // --------------------------------------------------------------------------
  ctx.font = 'bold 20px "JetBrains Mono", monospace';
  ctx.fillStyle = '#141413';
  const folio = record.euthynaFolio || `EUTHYNA #${String(index).padStart(5, '0')}`;
  ctx.fillText(folio, 32, yOffset + 50);

  // Status Badge
  const isSweep = record.category === 'YIELD_SWEEP';
  ctx.fillStyle = isSweep ? '#D4943A' : '#2E5A44';
  ctx.fillRect(32, yOffset + 70, isSweep ? 144 : 190, 26);

  ctx.font = 'bold 12px "JetBrains Mono", monospace';
  ctx.fillStyle = '#F2EFE9';
  ctx.fillText(isSweep ? 'POL-01 [SWEEP]' : 'POL-02 & 03 [PASSED]', 42, yOffset + 88);

  // UTC Timestamp
  ctx.font = '13px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(20, 20, 19, 0.65)';
  const dateStr = new Date(record.timestamp).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  ctx.fillText(dateStr, 32, yOffset + 138);

  ctx.font = '12px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(20, 20, 19, 0.45)';
  ctx.fillText('IMMUTABLE ARC L1 PROOF', 32, yOffset + 172);

  // --------------------------------------------------------------------------
  // COLUMN 2: COUNTERPARTY & TRANSACTION HASH
  // --------------------------------------------------------------------------
  ctx.font = 'bold 17px "JetBrains Mono", monospace';
  ctx.fillStyle = '#141413';
  ctx.fillText(`CATEGORY: ${record.category}`, 316, yOffset + 50);

  ctx.font = '14px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(20, 20, 19, 0.75)';
  const vendorShort = `${record.vendorAddress.slice(0, 10)}...${record.vendorAddress.slice(-8)}`;
  ctx.fillText(`COUNTERPARTY: ${vendorShort}`, 316, yOffset + 90);

  ctx.font = '13px "JetBrains Mono", monospace';
  ctx.fillStyle = '#C84B31';
  const txShort = record.txHash ? `${record.txHash.slice(0, 18)}...` : '0xb08127020a...';
  ctx.fillText(`TX: ${txShort}`, 316, yOffset + 138);

  ctx.font = '12px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(20, 20, 19, 0.45)';
  ctx.fillText('CIRCLE PAYMASTER // 0.00 USDC GASLESS SPONSORSHIP', 316, yOffset + 172);

  // --------------------------------------------------------------------------
  // COLUMN 3: MONUMENTAL SYNE VALUE & PROOF CTA
  // --------------------------------------------------------------------------
  ctx.font = 'bold 42px "Syne", sans-serif';
  ctx.fillStyle = '#141413';
  ctx.textAlign = 'right';
  const amountStr = `$${record.amountUsdc.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  ctx.fillText(amountStr, w - 36, yOffset + 66);

  ctx.font = '13px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(20, 20, 19, 0.65)';
  ctx.fillText('ASSET: USDC // ARC L1', w - 36, yOffset + 104);

  ctx.font = 'bold 12px "JetBrains Mono", monospace';
  ctx.fillStyle = '#141413';
  ctx.fillText('[+] HOVER TO EXTRACT PROOF', w - 36, yOffset + 172);
  ctx.textAlign = 'left';
}

export const EuthynaDataLoomCanvas: React.FC<EuthynaDataLoomCanvasProps> = React.memo(({
  invoices,
  generateBeancount,
  generateJsonLd
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredRecord, setHoveredRecord] = useState<ProcessedInvoice | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [hudVelocity, setHudVelocity] = useState(0);
  const [isLoomActive, setIsLoomActive] = useState(true);

  // Raycaster & coordinate tracking
  const mouseNdc = useRef(new THREE.Vector2(-999, -999));
  const hoveredIndexRef = useRef<number>(-1);
  const isPinnedRef = useRef(false);

  // --------------------------------------------------------------------------
  // THREE.JS DATA LOOM LIFECYCLE
  // --------------------------------------------------------------------------
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let animationFrameId: number;
    let width = mount.clientWidth || window.innerWidth;
    let height = mount.clientHeight || 720;

    // 1. SCENE & CAMERA
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#F2EFE9'); // Mineral Archive baseline

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.2);

    // 2. RENDERER (Capped strictly at 1.35 DPR)
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
    mount.appendChild(renderer.domElement);

    // 3. GENERATE TEXTURE ATLAS FROM INVOICE RECORDS
    const records = invoices.length > 0 ? invoices : [
      {
        invoiceRef: 'INV-SAMPLE-01',
        vendorAddress: '0x3333333333333333333333333333333333333333',
        amountUsdc: 120.0,
        category: 'INFRASTRUCTURE',
        status: 'PAID' as const,
        txHash: '0xb08127020a7f6ff2b68e88ae1535764177e7be22525f6f29372fe521cbed879e',
        gasCostUsdc: 0.0,
        timestamp: Date.now() - 3600000,
        euthynaFolio: 'EUTHYNA #00481'
      }
    ];

    const atlasCanvas = document.createElement('canvas');
    atlasCanvas.width = 1024;
    atlasCanvas.height = 240 * records.length;
    const atlasCtx = atlasCanvas.getContext('2d');

    if (atlasCtx) {
      records.forEach((rec, idx) => {
        drawSlabFace(atlasCtx, idx * 240, rec, idx);
      });
    }

    const atlasTexture = new THREE.CanvasTexture(atlasCanvas);
    atlasTexture.minFilter = THREE.LinearFilter;
    atlasTexture.magFilter = THREE.LinearFilter;
    atlasTexture.generateMipmaps = false;

    // 4. INSTANCED GEOMETRY WITH UNWOVEN VERTEX SHADER
    const geometry = new THREE.PlaneGeometry(SLAB_WIDTH, SLAB_HEIGHT, 24, 12);
    const instancedGeo = new THREE.InstancedBufferGeometry();
    instancedGeo.index = geometry.index;
    instancedGeo.attributes.position = geometry.attributes.position;
    instancedGeo.attributes.normal = geometry.attributes.normal;
    instancedGeo.attributes.uv = geometry.attributes.uv;

    const atlasOffsets = new Float32Array(SLAB_COUNT * 2);
    const atlasScales = new Float32Array(SLAB_COUNT * 2);
    const instanceIds = new Float32Array(SLAB_COUNT);
    const extractProgressArr = new Float32Array(SLAB_COUNT);

    const recordCount = records.length;
    for (let i = 0; i < SLAB_COUNT; i++) {
      const recIdx = i % recordCount;
      atlasOffsets[i * 2 + 0] = 0.0;
      atlasOffsets[i * 2 + 1] = recIdx / recordCount;
      atlasScales[i * 2 + 0] = 1.0;
      atlasScales[i * 2 + 1] = 1.0 / recordCount;
      instanceIds[i] = i;
      extractProgressArr[i] = 0.0;
    }

    instancedGeo.setAttribute('aAtlasOffset', new THREE.InstancedBufferAttribute(atlasOffsets, 2));
    instancedGeo.setAttribute('aAtlasScale', new THREE.InstancedBufferAttribute(atlasScales, 2));
    instancedGeo.setAttribute('aInstanceId', new THREE.InstancedBufferAttribute(instanceIds, 1));
    const extractAttr = new THREE.InstancedBufferAttribute(extractProgressArr, 1);
    instancedGeo.setAttribute('aExtractProgress', extractAttr);

    // 5. CUSTOM SHADER MATERIAL (Unwoven Weave Physics + Scroll Distortion)
    const vertexShader = `
      uniform float uTime;
      uniform float uVelocity;
      uniform float uWeaveIntensity;

      attribute vec2 aAtlasOffset;
      attribute vec2 aAtlasScale;
      attribute float aInstanceId;
      attribute float aExtractProgress;

      varying vec2 vUv;
      varying float vExtract;
      varying float vInstanceId;
      varying vec3 vWorldPos;

      void main() {
        // Sample exact record tile from atlas
        vUv = uv * aAtlasScale + aAtlasOffset;
        vExtract = aExtractProgress;
        vInstanceId = aInstanceId;

        vec3 pos = position;
        float nonExtract = 1.0 - aExtractProgress;

        // 1. Scroll-Velocity Vertical Stretch (Data Stream Motion Blur)
        float velStretch = 1.0 + min(abs(uVelocity) * 0.05, 0.45) * nonExtract;
        pos.y *= velStretch;

        // 2. Y-Axis Shear across X (The Codrops Unwoven diagonal tilt)
        float shear = clamp(uVelocity * 0.032, -0.25, 0.25) * nonExtract;
        pos.y += pos.x * shear;

        // 3. Z-Axis Spatial Weave Ripple (Smooth undulation along geometry)
        float waveZ = sin(pos.y * 1.8 + pos.x * 0.8 + uTime * 2.4) * (0.04 + min(abs(uVelocity) * 0.06, 0.18)) * nonExtract;
        pos.z += waveZ;

        vec4 worldPos = instanceMatrix * vec4(pos, 1.0);
        vWorldPos = worldPos.xyz;

        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `;

    const fragmentShader = `
      uniform sampler2D uAtlas;
      uniform float uTime;

      varying vec2 vUv;
      varying float vExtract;
      varying float vInstanceId;
      varying vec3 vWorldPos;

      void main() {
        vec4 texColor = texture2D(uAtlas, vUv);

        // Deep-Z Spatial Atmospheric Attenuation
        float depthFactor = clamp(1.0 - max(0.0, -vWorldPos.z) * 0.075, 0.45, 1.0);
        vec3 col = texColor.rgb * depthFactor;

        // When pulled forward to the camera plane, fully illuminate to crisp 100%
        if (vExtract > 0.001) {
          col = mix(col, texColor.rgb, vExtract);
        }

        gl_FragColor = vec4(col, texColor.a);
      }
    `;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uAtlas: { value: atlasTexture },
        uTime: { value: 0 },
        uVelocity: { value: 0 },
        uWeaveIntensity: { value: 1.0 }
      },
      side: THREE.DoubleSide
    });

    const instancedMesh = new THREE.InstancedMesh(instancedGeo, material, SLAB_COUNT);
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(instancedMesh);

    // Initial slab positions in the spatial loom
    const dummy = new THREE.Object3D();
    const halfSpan = (SLAB_COUNT * SLAB_SPACING_Y) / 2;
    const basePositionsY = new Float32Array(SLAB_COUNT);

    for (let i = 0; i < SLAB_COUNT; i++) {
      basePositionsY[i] = halfSpan - i * SLAB_SPACING_Y;
      const y = basePositionsY[i];
      const z = -Math.pow(Math.abs(y) * 0.18, 1.35) * 1.5 - 0.1;
      const rotX = y * 0.032;

      dummy.position.set(0, y, z);
      dummy.rotation.set(rotX, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
    }
    instancedMesh.instanceMatrix.needsUpdate = true;

    // 6. RAYCASTER & INTERACTION STATE
    const raycaster = new THREE.Raycaster();
    let flowOffsetY = 0;
    let time = 0;
    let dampedVelocity = 0;
    const extractProgress = new Float32Array(SLAB_COUNT);

    // Pointer move listener
    const handlePointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseNdc.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseNdc.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handlePointerLeave = () => {
      mouseNdc.current.set(-999, -999);
      if (!isPinnedRef.current) {
        hoveredIndexRef.current = -1;
        setHoveredRecord(null);
      }
    };

    const handleClick = () => {
      if (hoveredIndexRef.current !== -1) {
        const nextPinned = !isPinnedRef.current;
        isPinnedRef.current = nextPinned;
        setIsPinned(nextPinned);
      }
    };

    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerleave', handlePointerLeave);
    renderer.domElement.addEventListener('click', handleClick);

    // Resize handler
    const handleResize = () => {
      if (!mount) return;
      width = mount.clientWidth || window.innerWidth;
      height = mount.clientHeight || 720;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
    };
    window.addEventListener('resize', handleResize);

    // 7. ANIMATION RAF LOOP
    let isVisible = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(mount);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisible) return;

      time += 0.016;

      // Filter scroll velocity with critically damped mechanical decay
      const rawVelocity = getScrollVelocity();
      dampedVelocity += (rawVelocity - dampedVelocity) * 0.14;
      if (Math.abs(dampedVelocity) < 0.001) dampedVelocity = 0;

      material.uniforms.uTime.value = time;
      material.uniforms.uVelocity.value = dampedVelocity;

      // Update HUD telemetry
      setHudVelocity(Math.abs(dampedVelocity));

      // Raycasting against slabs
      if (!isPinnedRef.current && mouseNdc.current.x > -900) {
        raycaster.setFromCamera(mouseNdc.current, camera);
        const hits = raycaster.intersectObject(instancedMesh);
        if (hits.length > 0 && hits[0].instanceId !== undefined) {
          const hitIdx = hits[0].instanceId;
          if (hoveredIndexRef.current !== hitIdx) {
            hoveredIndexRef.current = hitIdx;
            const rec = records[hitIdx % records.length];
            setHoveredRecord(rec);
          }
        } else {
          if (hoveredIndexRef.current !== -1) {
            hoveredIndexRef.current = -1;
            setHoveredRecord(null);
          }
        }
      }

      // Vertical flow: paused when hovering a slab, otherwise cascading
      const isPaused = hoveredIndexRef.current !== -1 || isPinnedRef.current;
      setIsLoomActive(!isPaused);

      if (!isPaused) {
        const flowSpeed = 0.006 + Math.abs(dampedVelocity) * 0.045;
        flowOffsetY -= flowSpeed;
      }

      // Slabs spatial positioning & Z-axis extraction lerp
      let needsMatrixUpdate = false;
      const totalSpan = SLAB_COUNT * SLAB_SPACING_Y;

      for (let i = 0; i < SLAB_COUNT; i++) {
        const isHovered = hoveredIndexRef.current === i;
        const targetExtract = isHovered ? 1.0 : 0.0;
        extractProgress[i] += (targetExtract - extractProgress[i]) * 0.12;

        const prog = extractProgress[i];
        extractAttr.setX(i, prog);

        // Wrap around loop range
        let y = ((basePositionsY[i] + flowOffsetY + halfSpan) % totalSpan + totalSpan) % totalSpan - halfSpan;
        const baseZ = -Math.pow(Math.abs(y) * 0.18, 1.35) * 1.5 - 0.1;
        const baseRotX = y * 0.032;

        if (prog > 0.001) {
          // Forensic focus pull: smoothly moves to center Z=3.6 parallel to camera
          const actualX = THREE.MathUtils.lerp(0.0, 0.0, prog);
          const actualY = THREE.MathUtils.lerp(y, 0.0, prog);
          const actualZ = THREE.MathUtils.lerp(baseZ, 3.6, prog);
          const actualRotX = THREE.MathUtils.lerp(baseRotX, 0.0, prog);
          const actualScale = THREE.MathUtils.lerp(1.0, 1.18, prog);

          dummy.position.set(actualX, actualY, actualZ);
          dummy.rotation.set(actualRotX, 0, 0);
          dummy.scale.set(actualScale, actualScale, 1.0);
        } else {
          dummy.position.set(0, y, baseZ);
          dummy.rotation.set(baseRotX, 0, 0);
          dummy.scale.set(1, 1, 1);
        }

        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
        needsMatrixUpdate = true;
      }

      if (needsMatrixUpdate) {
        instancedMesh.instanceMatrix.needsUpdate = true;
        extractAttr.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 8. DISPOSAL & CLEANUP
    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerleave', handlePointerLeave);
      renderer.domElement.removeEventListener('click', handleClick);
      geometry.dispose();
      instancedGeo.dispose();
      material.dispose();
      atlasTexture.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [invoices]);

  const handleDismissDrawer = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPinned(false);
    isPinnedRef.current = false;
    hoveredIndexRef.current = -1;
    setHoveredRecord(null);
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '760px',
        backgroundColor: '#F2EFE9',
        overflow: 'hidden',
        userSelect: 'none'
      }}
    >
      {/* THREE.JS MOUNT CONTAINER */}
      <div
        ref={mountRef}
        style={{
          width: '100%',
          height: '100%',
          cursor: hoveredRecord ? 'pointer' : 'default'
        }}
      />

      {/* TOP ARCHITECTURAL HUD STATUS STRIP */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '36px',
          right: '36px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          letterSpacing: '0.14em',
          color: 'var(--mineral-ink)',
          pointerEvents: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: isLoomActive ? 'var(--signal-verified)' : 'var(--signal-amber)' }}>
            {isLoomActive ? '■ STREAMING CASCADE' : '▲ EXTRACTION LOCK ACTIVE'}
          </span>
          <span style={{ color: 'var(--mineral-ink-muted)' }}>//</span>
          <span>SPATIAL DEPTH: 1,400 MM</span>
          <span style={{ color: 'var(--mineral-ink-muted)' }}>//</span>
          <span>18 INSTANCED CHAPTER SLABS</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>VELOCITY COUPLING: {hudVelocity.toFixed(2)} M/S</span>
          <span style={{ color: 'var(--mineral-ink-muted)' }}>//</span>
          <span>CULLING: 60 FPS GPU</span>
        </div>
      </div>

      {/* BOTTOM CUE STRIP */}
      {!hoveredRecord && (
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: 0,
            width: '100%',
            textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.16em',
            color: 'var(--mineral-ink-muted)',
            pointerEvents: 'none'
          }}
        >
          // HOVER CALIPER CURSOR OVER ANY 3D SLAB TO EXTRACT FORENSIC PROOF TO CAMERA PLANE //
        </div>
      )}

      {/* ====================================================================
          PROJECTED FORENSIC DRAWER OVERLAY (BEANCOUNT + JSON-LD)
          Appears directly when a 3D slab is extracted to the camera plane
          ==================================================================== */}
      {hoveredRecord && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'min(1100px, 92%)',
            backgroundColor: 'var(--void-bg)',
            border: '1px solid var(--void-hairline)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
            color: 'var(--void-text-primary)',
            zIndex: 10,
            animation: 'fadeIn 0.18s ease'
          }}
        >
          {/* DRAWER TOP PERIMETER STRIP */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 24px',
              borderBottom: '1px solid var(--void-hairline)',
              backgroundColor: 'var(--void-surface)',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.12em'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--signal-amber)' }}>■</span>
              <span>
                FOCUSED CHAPTER: {hoveredRecord.euthynaFolio || 'EUTHYNA #00481'} // {hoveredRecord.amountUsdc.toFixed(2)} USDC
              </span>
              <span style={{ color: 'var(--void-text-muted)' }}>//</span>
              <span style={{ color: isPinned ? 'var(--signal-verified)' : 'var(--void-text-muted)' }}>
                {isPinned ? '[PINNED FORENSIC LOCK]' : '[HOVER FOCUS]'}
              </span>
            </div>

            <button
              onClick={handleDismissDrawer}
              style={{
                background: 'none',
                border: '1px solid var(--void-hairline)',
                color: 'var(--void-text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                letterSpacing: '0.14em',
                padding: '4px 10px',
                cursor: 'pointer'
              }}
            >
              [X DISMISS / RESUME STREAM]
            </button>
          </div>

          {/* SPLIT FORENSIC PANES: BEANCOUNT + JSON-LD */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              padding: '20px 24px',
              boxSizing: 'border-box'
            }}
          >
            {/* LEFT PANE: EXACT RAW BEANCOUNT RECORD */}
            <div
              style={{
                border: '1px solid var(--void-hairline)',
                backgroundColor: 'var(--void-surface)',
                padding: '16px'
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  letterSpacing: '0.16em',
                  color: 'var(--signal-amber)',
                  marginBottom: '10px',
                  borderBottom: '1px solid var(--void-hairline)',
                  paddingBottom: '6px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}
              >
                <span>// RAW BEANCOUNT DOUBLE-ENTRY RECORD</span>
                <span>UTF-8 // RFC-EUTHYNA</span>
              </div>
              <pre
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  lineHeight: 1.45,
                  color: 'var(--void-text-primary)',
                  whiteSpace: 'pre-wrap',
                  margin: 0,
                  maxHeight: '260px',
                  overflowY: 'auto'
                }}
              >
                {generateBeancount(hoveredRecord)}
              </pre>
            </div>

            {/* RIGHT PANE: EXACT SIGNED JSON-LD CRYPTOGRAPHIC RECEIPT */}
            <div
              style={{
                border: '1px solid var(--void-hairline)',
                backgroundColor: 'var(--void-surface)',
                padding: '16px'
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  letterSpacing: '0.16em',
                  color: 'var(--signal-verified)',
                  marginBottom: '10px',
                  borderBottom: '1px solid var(--void-hairline)',
                  paddingBottom: '6px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}
              >
                <span>// SIGNED JSON-LD ATTESTATION</span>
                <span>SCHEMA.ORG / FINANCIAL_TRANSACTION</span>
              </div>
              <pre
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  lineHeight: 1.45,
                  color: 'rgba(242, 239, 233, 0.88)',
                  whiteSpace: 'pre-wrap',
                  margin: 0,
                  maxHeight: '260px',
                  overflowY: 'auto'
                }}
              >
                {generateJsonLd(hoveredRecord)}
              </pre>
            </div>
          </div>

          {/* BOTTOM FORENSIC CONTROLS */}
          <div
            style={{
              padding: '10px 24px',
              borderTop: '1px solid var(--void-hairline)',
              backgroundColor: 'var(--void-surface)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px'
            }}
          >
            <div style={{ color: 'var(--void-text-muted)' }}>
              PAYMASTER: GASLESS 0.00 USDC // OPENSANCTIONS SCORE: 0.00 [CLEAN]
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard?.writeText(generateBeancount(hoveredRecord));
                }}
                style={{
                  background: 'none',
                  border: '1px solid var(--void-hairline)',
                  color: 'var(--void-text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  padding: '4px 8px',
                  cursor: 'pointer'
                }}
              >
                [ COPY BEANCOUNT ]
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard?.writeText(generateJsonLd(hoveredRecord));
                }}
                style={{
                  background: 'none',
                  border: '1px solid var(--void-hairline)',
                  color: 'var(--void-text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  padding: '4px 8px',
                  cursor: 'pointer'
                }}
              >
                [ COPY JSON-LD ]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
