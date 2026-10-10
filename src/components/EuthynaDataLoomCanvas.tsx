import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ProcessedInvoice } from '../core/useSakellariousEngine';
import { getScrollVelocity } from '../core/SmoothScroll';

export interface EuthynaDataLoomCanvasProps {
  invoices: ProcessedInvoice[];
  generateBeancount?: (item: ProcessedInvoice) => string;
  generateJsonLd?: (item: ProcessedInvoice) => string;
}

const SLAB_COUNT = 18;
const SLAB_WIDTH = 5.2;
const SLAB_HEIGHT = 1.22;
const SLAB_SPACING_X = 5.6;

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
  ctx.fillText('DOUBLE-ENTRY ARCHIVE // VERIFIED', w - 36, yOffset + 172);
  ctx.textAlign = 'left';
}

export const EuthynaDataLoomCanvas: React.FC<EuthynaDataLoomCanvasProps> = React.memo(({
  invoices
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hudVelocity, setHudVelocity] = useState(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let animationFrameId: number;
    let width = mount.clientWidth || window.innerWidth;
    let height = mount.clientHeight || 760;

    // 1. SCENE & CAMERA
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#F2EFE9'); // Mineral Archive baseline

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.2);

    // 2. RENDERER (Capped at 1.35 DPR)
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

    // 4. INSTANCED GEOMETRY (Flat, undistorted Three.js planes)
    const geometry = new THREE.PlaneGeometry(SLAB_WIDTH, SLAB_HEIGHT);
    const instancedGeo = new THREE.InstancedBufferGeometry();
    instancedGeo.index = geometry.index;
    instancedGeo.attributes.position = geometry.attributes.position;
    instancedGeo.attributes.uv = geometry.attributes.uv;

    const atlasOffsets = new Float32Array(SLAB_COUNT * 2);
    const atlasScales = new Float32Array(SLAB_COUNT * 2);

    const recordCount = records.length;
    for (let i = 0; i < SLAB_COUNT; i++) {
      const recIdx = i % recordCount;
      atlasOffsets[i * 2 + 0] = 0.0;
      atlasOffsets[i * 2 + 1] = recIdx / recordCount;
      atlasScales[i * 2 + 0] = 1.0;
      atlasScales[i * 2 + 1] = 1.0 / recordCount;
    }

    instancedGeo.setAttribute('aAtlasOffset', new THREE.InstancedBufferAttribute(atlasOffsets, 2));
    instancedGeo.setAttribute('aAtlasScale', new THREE.InstancedBufferAttribute(atlasScales, 2));

    // 5. CLEAN SHADER MATERIAL (Flat display-only planes, no wave distortion)
    const vertexShader = `
      attribute vec2 aAtlasOffset;
      attribute vec2 aAtlasScale;
      varying vec2 vUv;

      void main() {
        vUv = uv * aAtlasScale + aAtlasOffset;
        vec4 worldPos = instanceMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `;

    const fragmentShader = `
      uniform sampler2D uAtlas;
      varying vec2 vUv;

      void main() {
        gl_FragColor = texture2D(uAtlas, vUv);
      }
    `;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uAtlas: { value: atlasTexture }
      },
      side: THREE.DoubleSide
    });

    const instancedMesh = new THREE.InstancedMesh(instancedGeo, material, SLAB_COUNT);
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(instancedMesh);

    // Initial slab positions spaced along X-axis
    const dummy = new THREE.Object3D();
    const totalSpan = SLAB_COUNT * SLAB_SPACING_X;
    const halfSpan = totalSpan / 2;
    const basePositionsX = new Float32Array(SLAB_COUNT);

    for (let i = 0; i < SLAB_COUNT; i++) {
      basePositionsX[i] = i * SLAB_SPACING_X - halfSpan;
      dummy.position.set(basePositionsX[i], 0, 0);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
    }
    instancedMesh.instanceMatrix.needsUpdate = true;

    // 6. WHEEL & HORIZONTAL SCROLL CONVEYOR
    let flowOffsetX = 0;
    let dampedVelocity = 0;

    const handleWheel = (e: WheelEvent) => {
      flowOffsetX -= (e.deltaY || e.deltaX) * 0.006;
    };
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: true });

    // Resize handler
    const handleResize = () => {
      if (!mount) return;
      width = mount.clientWidth || window.innerWidth;
      height = mount.clientHeight || 760;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
    };
    window.addEventListener('resize', handleResize);

    // 7. ANIMATION RAF LOOP (Horizontal Conveyor Belt)
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

      // Filter scroll velocity with critically damped mechanical decay
      const rawVelocity = getScrollVelocity();
      dampedVelocity += (rawVelocity - dampedVelocity) * 0.14;
      if (Math.abs(dampedVelocity) < 0.001) dampedVelocity = 0;

      // Update HUD telemetry
      setHudVelocity(Math.abs(dampedVelocity));

      // Horizontal flow speed based on base glide speed + scroll velocity
      const flowSpeed = 0.016 + Math.abs(dampedVelocity) * 0.06;
      flowOffsetX -= flowSpeed;

      // Update instanced mesh positions along X-axis
      for (let i = 0; i < SLAB_COUNT; i++) {
        let x = ((basePositionsX[i] + flowOffsetX + halfSpan) % totalSpan + totalSpan) % totalSpan - halfSpan;
        dummy.position.set(x, 0, 0);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
      }
      instancedMesh.instanceMatrix.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // 8. DISPOSAL & CLEANUP
    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('wheel', handleWheel);
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
          height: '100%'
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
          <span style={{ color: 'var(--signal-verified)' }}>
            ■ CONTINUOUS CONVEYOR STREAM
          </span>
          <span style={{ color: 'var(--mineral-ink-muted)' }}>//</span>
          <span>HORIZONTAL SPATIAL RUNWAY</span>
          <span style={{ color: 'var(--mineral-ink-muted)' }}>//</span>
          <span>18 IMMUTABLE REGISTER SLABS</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>VELOCITY COUPLING: {hudVelocity.toFixed(2)} M/S</span>
          <span style={{ color: 'var(--mineral-ink-muted)' }}>//</span>
          <span>CULLING: 60 FPS GPU</span>
        </div>
      </div>
    </div>
  );
});
