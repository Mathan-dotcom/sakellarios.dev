import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ProcessedInvoice } from '../core/useSakellariousEngine';
import { safeCurrency, safeToFixed } from '../core/safeFormat';
import type { SlabViewModel, TxKind } from '../api/types';

const isLiveMode = import.meta.env.VITE_USE_LIVE_DATA === 'true';

export interface EuthynaDataLoomCanvasProps {
  invoices?: ProcessedInvoice[];
  slabs?: SlabViewModel[];
  generateBeancount?: (item: ProcessedInvoice) => string;
  generateJsonLd?: (item: ProcessedInvoice) => string;
  onVelocityChange?: (velocity: number) => void;
  onFallbackToTable?: () => void;
  isHalted?: boolean;
  gap?: number;
}

/* ================================================================== *
 * 1. Configuration (Faithful to Reference, Adapted for Ledger Slabs)
 * ================================================================== */
const SLAB_WIDTH = 1080;   // CSS px
const SLAB_HEIGHT = 235;   // CSS px (cardAspect = 1080 / 235 ~ 4.6)
const SLAB_COUNT = 18;     // 18 distinct immutable register slabs

// Geometry density: ~17px per segment and ~17px per ribbon height
const THREADS = Math.round(SLAB_HEIGHT / 17);   // 14 ribbons
const SEGMENTS = Math.round(SLAB_WIDTH / 17);   // 64 segments

const CONFIG = {
  threads: THREADS,
  segments: SEGMENTS,
  slabWidth: SLAB_WIDTH,
  slabHeight: SLAB_HEIGHT,
  cardRadius: 0,          // Square corners
  defaultGap: 56,         // Configurable slab gap
  scrollSpeed: 95,        // px per second at rest
  flingMax: 4200,         // px per second cap after a drag
  tearZoneRatio: 0.26,    // unravelling zone fraction from edges
  tearZoneMax: 380,       // px cap
};

/* ================================================================== *
 * 2. Shaders
 *    (Exact Reference Shaders + Allowed Changes: uPageColor, uShade, uGlint)
 * ================================================================== */
const VERTEX_SHADER = /* glsl */ `
  attribute float aThread;   // ribbon index, 0 .. threads-1
  attribute float aRim;      // -1 at the ribbon's top edge, +1 at the bottom

  uniform float uTime;
  uniform float uHalfWidth;  // half the viewport width, in pixels
  uniform float uZone;       // depth of the tear zone at each edge, in pixels
  uniform float uStrength;   // global 0..1 master switch, tweened on load
  uniform float uWobble;     // 0 when the user prefers reduced motion
  uniform float uSeed;       // per-card, so two cards never unravel alike

  varying vec2  vUv;
  varying float vTear;       // 0 = woven, 1 = fully unravelled
  varying float vRim;
  varying float vRandom;     // this ribbon's random value, for the fragment stage

  float hash(float n) {
    return fract(sin(n * 127.1 + 311.7) * 43758.5453);
  }

  void main() {
    vUv = uv;
    vRim = aRim;

    vec4 world = modelMatrix * vec4(position, 1.0);
    float x = world.x;

    // How far into a tear zone is this vertex? Note both smoothsteps are
    // written low-edge-first; GLSL leaves edge0 >= edge1 undefined.
    float left  = 1.0 - smoothstep(-uHalfWidth, -uHalfWidth + uZone, x);
    float right = smoothstep(uHalfWidth - uZone, uHalfWidth, x);
    float tear  = max(left, right) * uStrength;

    // Zones never overlap the centre, so the sign of x is the escape direction.
    float direction = x < 0.0 ? -1.0 : 1.0;

    float randomA = hash(aThread + uSeed * 57.0);
    float randomB = hash(aThread * 3.7 + uSeed * 91.0);
    vRandom = randomA;

    // Bias the ramp so the card stays readable for longer, then lets go fast.
    float t = pow(tear, 1.4);

    // Each ribbon escapes at its own speed, which is what makes the edge
    // read as a comb of threads rather than one sliding sheet.
    float run = t * (60.0 + randomA * 420.0);
    run *= 0.85 + 0.15 * sin(uTime * (1.0 + randomB * 2.0) + randomA * 6.2831);
    world.x += direction * run;

    // The weave loosens vertically too, so ribbons drift out of their rows.
    world.y += (randomA - 0.5) * 170.0 * t * t;

    // Loose-thread flutter, sampled along the ribbon's displaced length.
    world.y += sin(world.x * 0.02 + uTime * (1.6 + randomA * 2.2) + randomA * 6.2831)
               * (5.0 + 13.0 * randomA) * t * uWobble;

    vTear = tear;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform sampler2D uMap;
  uniform vec2  uCardSize;    // px
  uniform float uRadius;      // px
  uniform float uImageAspect; // width / height of the texture
  uniform vec3  uPageColor;   // section background in raw sRGB floats
  uniform float uShade;       // side-shading strength
  uniform float uGlint;       // core glint strength

  varying vec2  vUv;
  varying float vTear;
  varying float vRim;
  varying float vRandom;

  float sdRoundBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  void main() {
    float tear = vTear;
    float rim  = abs(vRim); // 0 at the ribbon's core, 1 at its edge

    // --- Open the weave -------------------------------------------------
    // The ribbon geometry stays a fixed height; we shrink the *visible*
    // band inside it. Doing this in the fragment stage keeps the edges
    // antialiased and lets the card be perfectly gapless when woven.
    float coreWidth = mix(0.8, 0.16 + vRandom * 0.12, smoothstep(0.0, 0.85, tear));
    float threadAlpha = 1.0 - smoothstep(coreWidth - 0.10, coreWidth + 0.06, rim);
    threadAlpha = mix(1.0, threadAlpha, smoothstep(0.03, 0.30, tear));

    // --- Card silhouette ------------------------------------------------
    vec2 p = (vUv - 0.5) * uCardSize;
    float cardAlpha = 1.0 - smoothstep(-1.5, 0.5, sdRoundBox(p, uCardSize * 0.5, uRadius));

    float fade  = 1.0 - smoothstep(0.75, 1.0, tear) * 0.65;
    float alpha = cardAlpha * threadAlpha * fade;
    if (alpha < 0.003) discard;

    // --- Sample the image, cover-fitted to the card ----------------------
    float cardAspect = uCardSize.x / uCardSize.y;
    vec2 scale = cardAspect > uImageAspect
      ? vec2(1.0, uImageAspect / cardAspect)
      : vec2(cardAspect / uImageAspect, 1.0);
    vec3 color = texture2D(uMap, (vUv - 0.5) * scale + 0.5).rgb;

    // --- Give each ribbon a round, physical read --------------------------
    color *= 1.0 - tear * uShade * rim * rim;                          // shade the sides
    color += tear * uGlint * (1.0 - smoothstep(0.0, 0.45, rim));      // glint on the core
    color = mix(color, uPageColor, smoothstep(0.55, 1.0, tear) * 0.8); // bleach into the page

    gl_FragColor = vec4(color, alpha);
  }
`;

/* ================================================================== *
 * 3. Ribbon geometry (Reference Verbatim)
 * ================================================================== */
function buildRibbonGeometry(width: number, height: number, threads: number, segments: number): THREE.BufferGeometry {
  const columns = segments + 1;
  const perThread = columns * 2;
  const total = threads * perThread;

  const positions = new Float32Array(total * 3);
  const uvs = new Float32Array(total * 2);
  const rims = new Float32Array(total);
  const threadIds = new Float32Array(total);
  const indices: number[] = [];

  let v = 0;
  for (let t = 0; t < threads; t++) {
    for (let row = 0; row < 2; row++) {
      const vy = (t + row) / threads; // 0 at the bottom of the card, 1 at the top
      for (let c = 0; c < columns; c++) {
        const ux = c / segments;
        positions[v * 3 + 0] = (ux - 0.5) * width;
        positions[v * 3 + 1] = (vy - 0.5) * height;
        positions[v * 3 + 2] = 0;
        uvs[v * 2 + 0] = ux;
        uvs[v * 2 + 1] = vy;
        rims[v] = row === 0 ? -1 : 1;
        threadIds[v] = t;
        v++;
      }
    }

    const base = t * perThread;
    for (let c = 0; c < segments; c++) {
      const bl = base + c;
      const br = base + c + 1;
      const tl = base + columns + c;
      const tr = base + columns + c + 1;
      indices.push(bl, br, tl, br, tr, tl);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setAttribute("aRim", new THREE.BufferAttribute(rims, 1));
  geometry.setAttribute("aThread", new THREE.BufferAttribute(threadIds, 1));
  geometry.setIndex(indices);
  return geometry;
}

function parseColorToRgbFloats(hex: string): THREE.Vector3 {
  const clean = hex.replace('#', '').trim();
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return new THREE.Vector3(r, g, b);
}

/* ================================================================== *
 * 4. Distinct Ledger Slab Texture Painter
 * ================================================================== */
interface SlabRecord {
  folio: string;
  category: string;
  vendor: string;
  amount: number | undefined;
  tx: string;
  timestamp: string;
  isSweep: boolean;
  txKind?: TxKind;
  isDerivedOrdinal?: boolean;
}

const DEFAULT_SLAB_DATA: SlabRecord[] = [
  { folio: 'EUTHYNA #00481', category: 'INFRASTRUCTURE', vendor: '0x3333333333333333333333333333333333333333', amount: 120.00, tx: '0xb08127020a7f6ff2184...', timestamp: '2024-10-08 11:00:00 UTC', isSweep: false },
  { folio: 'EUTHYNA #00480', category: 'YIELD_SWEEP', vendor: '0x1111111111111111111111111111111111111111', amount: 85000.00, tx: '0x7e8c182a4d33bb0f121...', timestamp: '2024-10-08 10:00:00 UTC', isSweep: true },
  { folio: 'EUTHYNA #00479', category: 'PAYROLL', vendor: '0x4444444444444444444444444444444444444444', amount: 14250.00, tx: '0x91d84b221088cf7139a...', timestamp: '2024-10-08 09:30:00 UTC', isSweep: false },
  { folio: 'EUTHYNA #00478', category: 'LIQUIDITY_BUFFER', vendor: '0x2222222222222222222222222222222222222222', amount: 45000.00, tx: '0x3a48e71c99f012de940...', timestamp: '2024-10-08 08:45:00 UTC', isSweep: false },
  { folio: 'EUTHYNA #00477', category: 'YIELD_SWEEP', vendor: '0x1111111111111111111111111111111111111111', amount: 32000.00, tx: '0x5c721980ab23f998411...', timestamp: '2024-10-08 07:15:00 UTC', isSweep: true },
  { folio: 'EUTHYNA #00476', category: 'SECURITY_AUDIT', vendor: '0x5555555555555555555555555555555555555555', amount: 18500.00, tx: '0x88f12a39c099e8d1234...', timestamp: '2024-10-08 06:00:00 UTC', isSweep: false },
  { folio: 'EUTHYNA #00475', category: 'ORACLE_SUBSCRIPTION', vendor: '0x6666666666666666666666666666666666666666', amount: 850.00, tx: '0x2b4c6e8019aa55bc439...', timestamp: '2024-10-08 05:20:00 UTC', isSweep: false },
  { folio: 'EUTHYNA #00474', category: 'YIELD_SWEEP', vendor: '0x1111111111111111111111111111111111111111', amount: 62400.00, tx: '0xef1092a838dc44b0291...', timestamp: '2024-10-08 04:10:00 UTC', isSweep: true },
  { folio: 'EUTHYNA #00473', category: 'COMPLIANCE_ATTESTATION', vendor: '0x7777777777777777777777777777777777777777', amount: 5600.00, tx: '0x4388e21a009bc5431f8...', timestamp: '2024-10-08 03:00:00 UTC', isSweep: false },
  { folio: 'EUTHYNA #00472', category: 'GASLESS_RELAY_FEE', vendor: '0x8888888888888888888888888888888888888888', amount: 240.00, tx: '0x6a190b345efc1920872...', timestamp: '2024-10-08 02:40:00 UTC', isSweep: false },
  { folio: 'EUTHYNA #00471', category: 'YIELD_SWEEP', vendor: '0x1111111111111111111111111111111111111111', amount: 91500.00, tx: '0x19f8e439bb90aa23485...', timestamp: '2024-10-08 01:15:00 UTC', isSweep: true },
  { folio: 'EUTHYNA #00470', category: 'TREASURY_REBALANCE', vendor: '0x9999999999999999999999999999999999999999', amount: 110000.00, tx: '0x77d01c92a8491823901...', timestamp: '2024-10-07 23:50:00 UTC', isSweep: false },
  { folio: 'EUTHYNA #00469', category: 'NODE_STAKING_REWARD', vendor: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', amount: 3750.00, tx: '0x88e1a90234fcb194820...', timestamp: '2024-10-07 22:30:00 UTC', isSweep: false },
  { folio: 'EUTHYNA #00468', category: 'YIELD_SWEEP', vendor: '0x1111111111111111111111111111111111111111', amount: 48900.00, tx: '0x00a891f74239840192e...', timestamp: '2024-10-07 21:00:00 UTC', isSweep: true },
  { folio: 'EUTHYNA #00467', category: 'SMART_CONTRACT_ESCROW', vendor: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', amount: 27500.00, tx: '0x9812bc8834928100234...', timestamp: '2024-10-07 19:45:00 UTC', isSweep: false },
  { folio: 'EUTHYNA #00466', category: 'INSURANCE_PREMIUM', vendor: '0xcccccccccccccccccccccccccccccccccccccccc', amount: 4200.00, tx: '0x3344556677889900aabb...', timestamp: '2024-10-07 18:20:00 UTC', isSweep: false },
  { folio: 'EUTHYNA #00465', category: 'YIELD_SWEEP', vendor: '0x1111111111111111111111111111111111111111', amount: 77200.00, tx: '0x5566778899aabbccddeeff...', timestamp: '2024-10-07 17:00:00 UTC', isSweep: true },
  { folio: 'EUTHYNA #00464', category: 'TAX_WITHHOLDING', vendor: '0xdddddddddddddddddddddddddddddddddddddddd', amount: 16800.00, tx: '0x778899aabbccddeeff0011...', timestamp: '2024-10-07 15:30:00 UTC', isSweep: false }
];

function drawSlabTexture(
  record: SlabRecord,
  cssWidth: number,
  cssHeight: number,
  dpr: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.scale(dpr, dpr);
  const w = cssWidth;
  const h = cssHeight;

  // 1. Solid Matte Mineral Slab Surface
  ctx.fillStyle = '#F7F5F0';
  ctx.fillRect(0, 0, w, h);

  // 2. 1px Hairline Perimeter Border
  ctx.strokeStyle = 'rgba(20, 20, 19, 0.28)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

  // 3. Precision Corner Crop Marks / Caliper Ticks
  const tick = 14;
  ctx.strokeStyle = '#141413';
  ctx.lineWidth = 2;
  // Top-left
  ctx.beginPath();
  ctx.moveTo(0, tick);
  ctx.lineTo(0, 0);
  ctx.lineTo(tick, 0);
  ctx.stroke();
  // Top-right
  ctx.beginPath();
  ctx.moveTo(w - tick, 0);
  ctx.lineTo(w, 0);
  ctx.lineTo(w, tick);
  ctx.stroke();
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(0, h - tick);
  ctx.lineTo(0, h);
  ctx.lineTo(tick, h);
  ctx.stroke();
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(w - tick, h);
  ctx.lineTo(w, h);
  ctx.lineTo(w, h - tick);
  ctx.stroke();

  // 4. Internal Dividing Hairlines
  ctx.strokeStyle = 'rgba(20, 20, 19, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(316, 0);
  ctx.lineTo(316, h);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(706, 0);
  ctx.lineTo(706, h);
  ctx.stroke();

  // 5. Hatched Woven Ribbon Divider Strip & Crop Marks
  ctx.strokeStyle = 'rgba(20, 20, 19, 0.18)';
  ctx.lineWidth = 1;
  for (let y = 16; y < h - 16; y += 12) {
    ctx.beginPath();
    ctx.moveTo(312, y);
    ctx.lineTo(320, y + 6);
    ctx.stroke();
  }

  // --------------------------------------------------------------------------
  // COLUMN 1: EUTHYNA FOLIO, BADGE, TIMESTAMP & PROOF
  // --------------------------------------------------------------------------
  ctx.textAlign = 'left';
  ctx.font = 'bold 20px "JetBrains Mono", monospace';
  ctx.fillStyle = '#141413';
  ctx.fillText(record.isDerivedOrdinal ? `${record.folio} [ORDINAL]` : record.folio, 34, 48);

  // Policy Badge
  const badgeWidth = record.isSweep ? 144 : 190;
  ctx.fillStyle = record.isSweep ? '#D4943A' : '#2E5A44';
  ctx.fillRect(34, 68, badgeWidth, 26);

  ctx.font = 'bold 11px "JetBrains Mono", monospace';
  ctx.fillStyle = '#F2EFE9';
  ctx.fillText(record.isSweep ? 'POL-01 [SWEEP]' : 'POL-02 & 03 [PASSED]', 44, 85);

  // UTC Timestamp
  ctx.font = '13px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(20, 20, 19, 0.65)';
  ctx.fillText(record.timestamp, 34, 138);

  ctx.font = '12px "JetBrains Mono", monospace';
  if (record.txKind === 'onchain') {
    ctx.fillStyle = '#2E5A44';
    ctx.fillText('IMMUTABLE ARC L1 PROOF', 34, 172);
  } else if (record.txKind === 'simulated') {
    ctx.fillStyle = 'rgba(20, 20, 19, 0.45)';
    ctx.fillText('SIMULATED SETTLEMENT // NO ON-CHAIN TX', 34, 172);
  } else if (record.txKind === 'unknown' || isLiveMode) {
    ctx.fillStyle = 'rgba(20, 20, 19, 0.45)';
    ctx.fillText('SETTLEMENT UNVERIFIED', 34, 172);
  } else {
    ctx.fillStyle = '#2E5A44';
    ctx.fillText('IMMUTABLE ARC L1 PROOF', 34, 172);
  }

  // --------------------------------------------------------------------------
  // COLUMN 2: CATEGORY, COUNTERPARTY & TRANSACTION HASH
  // --------------------------------------------------------------------------
  ctx.font = 'bold 17px "JetBrains Mono", monospace';
  ctx.fillStyle = '#141413';
  ctx.fillText(`CATEGORY: ${record.category}`, 342, 48);

  ctx.font = '14px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(20, 20, 19, 0.75)';
  const vendorShort = record.vendor.length > 20
    ? `${record.vendor.slice(0, 10)}...${record.vendor.slice(-8)}`
    : record.vendor;
  ctx.fillText(`COUNTERPARTY: ${vendorShort}`, 342, 88);

  ctx.font = '13px "JetBrains Mono", monospace';
  ctx.fillStyle = '#C84B31';
  ctx.fillText(`TX: ${record.tx}`, 342, 138);

  ctx.font = '12px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(20, 20, 19, 0.45)';
  if (record.txKind === 'simulated') {
    ctx.fillText('CIRCLE PAYMASTER // SIMULATED SPONSORSHIP', 342, 172);
  } else {
    ctx.fillText('CIRCLE PAYMASTER // 0.00 USDC GASLESS SPONSORSHIP', 342, 172);
  }

  // --------------------------------------------------------------------------
  // COLUMN 3: MONUMENTAL SYNE NUMERAL & PROOF STATUS
  // --------------------------------------------------------------------------
  ctx.textAlign = 'right';
  ctx.font = 'bold 42px "Syne", sans-serif';
  ctx.fillStyle = '#141413';
  const amountStr = safeCurrency(record.amount, '$', { minimumFractionDigits: 2 });
  ctx.fillText(amountStr, w - 34, 66);

  ctx.font = '13px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(20, 20, 19, 0.65)';
  ctx.fillText('ASSET: USDC // ARC L1', w - 34, 104);

  ctx.font = 'bold 12px "JetBrains Mono", monospace';
  ctx.fillStyle = '#141413';
  if (isLiveMode || (record.txKind && record.txKind !== 'onchain')) {
    ctx.fillText('DOUBLE-ENTRY ARCHIVE // RECORDED', w - 34, 172);
  } else {
    ctx.fillText('DOUBLE-ENTRY ARCHIVE // VERIFIED', w - 34, 172);
  }
  ctx.textAlign = 'left';

  return canvas;
}

function createTexture(source: HTMLCanvasElement): THREE.Texture {
  const texture = new THREE.Texture(source);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

export const EuthynaDataLoomCanvas: React.FC<EuthynaDataLoomCanvasProps> = React.memo(({
  invoices,
  slabs,
  onVelocityChange,
  onFallbackToTable,
  isHalted,
  gap
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef<number | null>(null);
  const [hudVelocity, setHudVelocity] = useState(0);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    let disposed = false;
    let tickerAdded = false;

    const reduceMotion = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Initialise WebGLRenderer
    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
    } catch (err) {
      console.warn('WebGL unavailable in EuthynaDataLoomCanvas', err);
      onFallbackToTable?.();
      return;
    }

    if (!renderer) {
      onFallbackToTable?.();
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    stage.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    // Orthographic camera: 1 world unit = 1 CSS px
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -100, 100);

    // 2. Shared Uniforms
    const shared = {
      uTime:      { value: 0 },
      uHalfWidth: { value: 1 },
      uZone:      { value: 1 },
      uStrength:  { value: 0 },
      uWobble:    { value: reduceMotion ? 0 : 1 },
      uCardSize:  { value: new THREE.Vector2(CONFIG.slabWidth, CONFIG.slabHeight) },
      uRadius:    { value: CONFIG.cardRadius },
      uPageColor: { value: parseColorToRgbFloats('#F2EFE9') },
      uShade:     { value: 0.4 },
      uGlint:     { value: 0.18 },
    };

    // 3. Assemble Slabs (Flag off: today's 18 mock slabs; Flag on: newest 18 live slabs)
    const isLiveMode = import.meta.env.VITE_USE_LIVE_DATA === 'true';

    let slabRecords: SlabRecord[] = [];
    if (isLiveMode) {
      const sourceSlabs = slabs || [];
      const newest18 = sourceSlabs.slice(-18);
      slabRecords = newest18.map((s) => ({
        folio: s.id,
        category: s.category,
        vendor: s.vendor || s.counterparty || '0x0000000000000000000000000000000000000000',
        amount: s.amount,
        tx: s.txHash ? `${s.txHash.slice(0, 18)}...` : '0x0000000000...',
        timestamp: s.timestampUtc || '0000-00-00 00:00:00 UTC',
        isSweep: s.category === 'YIELD_SWEEP',
        txKind: s.txKind,
        isDerivedOrdinal: s.idSource === 'derived-ordinal',
      }));
    } else {
      slabRecords = Array.from({ length: SLAB_COUNT }, (_, i) => {
        if (invoices && invoices[i]) {
          const inv = invoices[i];
          const dateStr = new Date(inv.timestamp).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
          return {
            folio: inv.euthynaFolio || `EUTHYNA #${String(i).padStart(5, '0')}`,
            category: inv.category,
            vendor: inv.vendorAddress,
            amount: inv.amountUsdc,
            tx: inv.txHash ? `${inv.txHash.slice(0, 18)}...` : '0xb08127020a...',
            timestamp: dateStr,
            isSweep: inv.category === 'YIELD_SWEEP',
          };
        }
        return DEFAULT_SLAB_DATA[i % DEFAULT_SLAB_DATA.length];
      });
    }

    const activeCount = slabRecords.length;

    // 4. One Shared BufferGeometry for ribbons
    const geometry = buildRibbonGeometry(
      CONFIG.slabWidth,
      CONFIG.slabHeight,
      CONFIG.threads,
      CONFIG.segments
    );

    // 5. Build Meshes (Each with unique material, texture & seed)
    const cards: { mesh: THREE.Mesh; baseX: number }[] = [];
    const materials: THREE.ShaderMaterial[] = [];
    const textures: THREE.Texture[] = [];

    const effectiveGap = typeof gap === 'number' ? gap : CONFIG.defaultGap;
    const pitch = CONFIG.slabWidth + effectiveGap;
    const stripSpan = Math.max(1, activeCount * pitch);

    // 6. Motion state (preserve scroll offset across live appends)
    let baseSpeed = reduceMotion || isHalted || activeCount === 0 ? 0 : CONFIG.scrollSpeed;
    const motion = { velocity: 0 };
    if (offsetRef.current === null) {
      offsetRef.current = stripSpan / 2;
    }

    const velocityTween = gsap.to(motion, {
      velocity: baseSpeed,
      duration: 2.4,
      ease: 'power2.out',
      delay: 0.35
    });

    const strengthTween = gsap.to(shared.uStrength, {
      value: 1,
      duration: 1.8,
      ease: 'power3.inOut',
      delay: 0.2
    });

    // Paint textures when fonts are ready
    const initTexturesAndCards = async () => {
      if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
        try {
          await document.fonts.ready;
        } catch (e) {
          // ignore font loading fallback
        }
      }
      if (disposed) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      for (let i = 0; i < activeCount; i++) {
        const record = slabRecords[i];
        const canvas = drawSlabTexture(record, CONFIG.slabWidth, CONFIG.slabHeight, dpr);
        const texture = createTexture(canvas);
        textures.push(texture);

        const material = new THREE.ShaderMaterial({
          vertexShader: VERTEX_SHADER,
          fragmentShader: FRAGMENT_SHADER,
          transparent: true,
          depthTest: false,
          depthWrite: false,
          uniforms: {
            uMap: { value: texture },
            uSeed: { value: (i + 1) * 0.731 },
            uImageAspect: { value: CONFIG.slabWidth / CONFIG.slabHeight },
            uTime: shared.uTime,
            uHalfWidth: shared.uHalfWidth,
            uZone: shared.uZone,
            uStrength: shared.uStrength,
            uWobble: shared.uWobble,
            uCardSize: shared.uCardSize,
            uRadius: shared.uRadius,
            uPageColor: shared.uPageColor,
            uShade: shared.uShade,
            uGlint: shared.uGlint,
          },
        });
        materials.push(material);

        const mesh = new THREE.Mesh(geometry, material);
        mesh.frustumCulled = false;
        scene.add(mesh);
        cards.push({ mesh, baseX: i * pitch });
      }
    };

    initTexturesAndCards();

    // 7. Sizing from container via ResizeObserver
    function resize() {
      if (!stage || !renderer) return;
      const viewportWidth = stage.clientWidth;
      const viewportHeight = stage.clientHeight;

      renderer.setSize(viewportWidth, viewportHeight);
      camera.left = -viewportWidth / 2;
      camera.right = viewportWidth / 2;
      camera.top = viewportHeight / 2;
      camera.bottom = -viewportHeight / 2;
      camera.updateProjectionMatrix();

      shared.uHalfWidth.value = viewportWidth / 2;
      shared.uZone.value = Math.min(viewportWidth * CONFIG.tearZoneRatio, CONFIG.tearZoneMax);
      shared.uCardSize.value.set(CONFIG.slabWidth, CONFIG.slabHeight);
    }

    // 8. Pointer Drag & Fling Mechanics (touch-action: pan-y)
    let dragging = false;
    let lastX = 0, lastTime = 0, dragVelocity = 0;

    const handlePointerDown = (event: PointerEvent) => {
      dragging = true;
      lastX = event.clientX;
      lastTime = performance.now();
      dragVelocity = 0;
      stage.style.cursor = 'grabbing';
      stage.setPointerCapture(event.pointerId);
      gsap.killTweensOf(motion);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const now = performance.now();
      const dx = event.clientX - lastX;
      const dt = Math.max(1, now - lastTime) / 1000;
      if (offsetRef.current !== null) {
        offsetRef.current -= dx;
      }
      dragVelocity += (-dx / dt - dragVelocity) * 0.35;
      lastX = event.clientX;
      lastTime = now;
    };

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      stage.style.cursor = 'grab';
      motion.velocity = gsap.utils.clamp(-CONFIG.flingMax, CONFIG.flingMax, dragVelocity);
      gsap.to(motion, { velocity: baseSpeed, duration: 2.2, ease: 'power3.out' });
    };

    stage.addEventListener('pointerdown', handlePointerDown);
    stage.addEventListener('pointermove', handlePointerMove);
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);
    stage.addEventListener('lostpointercapture', endDrag);

    // 9. Frame loop & Offscreen Pausing via IntersectionObserver
    let isVisible = true;
    const iObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { threshold: 0.05 });
    iObserver.observe(stage);

    const tickerCallback = (time: number, deltaMS: number) => {
      if (!isVisible) return;
      if (!dragging && offsetRef.current !== null) {
        offsetRef.current += motion.velocity * (deltaMS / 1000);
      }
      shared.uTime.value = time;

      const currentVel = Math.abs(motion.velocity) / 100;
      setHudVelocity(currentVel);
      onVelocityChange?.(motion.velocity);

      if (activeCount > 0) {
        const half = stripSpan / 2;
        const currentOffset = offsetRef.current ?? half;
        for (const card of cards) {
          const x = ((card.baseX - currentOffset) % stripSpan + stripSpan) % stripSpan;
          card.mesh.position.x = x - half;
        }
      }

      renderer?.render(scene, camera);
    };

    gsap.ticker.add(tickerCallback);
    tickerAdded = true;

    // ResizeObserver
    let rObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      rObserver = new ResizeObserver(() => resize());
      rObserver.observe(stage);
    }
    resize();

    // 10. Lifecycle Cleanup on Unmount
    return () => {
      disposed = true;
      if (tickerAdded) gsap.ticker.remove(tickerCallback);
      velocityTween.kill();
      strengthTween.kill();
      gsap.killTweensOf(motion);

      stage.removeEventListener('pointerdown', handlePointerDown);
      stage.removeEventListener('pointermove', handlePointerMove);
      stage.removeEventListener('pointerup', endDrag);
      stage.removeEventListener('pointercancel', endDrag);
      stage.removeEventListener('lostpointercapture', endDrag);

      iObserver.disconnect();
      if (rObserver) rObserver.disconnect();

      cards.forEach(card => scene.remove(card.mesh));
      cards.length = 0;
      geometry.dispose();

      materials.forEach(mat => mat.dispose());
      textures.forEach(tex => tex.dispose());

      if (renderer) {
        try {
          renderer.dispose();
          const gl = renderer.getContext();
          const ext = gl?.getExtension('WEBGL_lose_context');
          if (ext) ext.loseContext();
        } catch (e) {
          // ignore
        }
        if (renderer.domElement && stage.contains(renderer.domElement)) {
          stage.removeChild(renderer.domElement);
        }
      }
    };
  }, [invoices, slabs, isHalted, gap, onVelocityChange, onFallbackToTable]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '760px',
        backgroundColor: 'transparent',
        overflow: 'hidden',
        userSelect: 'none'
      }}
    >
      {/* UNWOVEN RUNWAY STAGE */}
      <div
        ref={stageRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          cursor: 'grab',
          touchAction: 'pan-y'
        }}
      />

      {/* EMPTY RUNWAY STATE IN LIVE MODE WHEN ZERO SLABS */}
      {isLiveMode && (slabs?.length ?? 0) === 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 15
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              letterSpacing: '0.16em',
              color: 'var(--mineral-ink)',
              fontWeight: 600,
              textTransform: 'uppercase',
              marginBottom: '6px'
            }}
          >
            NO AUDIT RECEIPTS RECORDED // EMPTY RUNWAY
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.1em',
              color: 'var(--mineral-ink-muted)'
            }}
          >
            AWAITING ON-CHAIN OR SIMULATED SETTLEMENT TRANSACTIONS
          </div>
        </div>
      )}

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
          pointerEvents: 'none',
          zIndex: 20
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: 'var(--signal-verified)' }}>
            ■ CONTINUOUS CONVEYOR STREAM
          </span>
          <span style={{ color: 'var(--mineral-ink-muted)' }}>//</span>
          <span>HORIZONTAL SPATIAL RUNWAY</span>
          <span style={{ color: 'var(--mineral-ink-muted)' }}>//</span>
          <span>{isLiveMode ? `${slabs?.length ?? 0} LIVE REGISTER SLABS` : '18 IMMUTABLE REGISTER SLABS'}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>VELOCITY COUPLING: {safeToFixed(hudVelocity, 2)} M/S</span>
          <span style={{ color: 'var(--mineral-ink-muted)' }}>//</span>
          <span>CULLING: 60 FPS GPU</span>
        </div>
      </div>
    </div>
  );
});
