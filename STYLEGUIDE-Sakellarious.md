# Sakellarious — Byzantine Ledger Editorial Design System
**Version:** 1.0.0
**Specification Document:** Autonomous Continuous Treasury & Business Operator (Arc L1)
**Supersedes visual direction of:** Vestiarion AI — Imperial Arc Neo-Brutalism v6.0.0
**Target Environments:** Web / Desktop Command Center

---

## 0. Naming Research — Why "Sakellarious"

The name derives from **σακελλάριος (*sakellarios*)**, a real Byzantine court and
ecclesiastical office — the official responsible for the *sakellion*, the
empire's cash treasury. The term traces further back to Late Latin
*sacellarius*, from *sacellum* ("small shrine" or "strongbox").

This is not a cosmetic rename. Byzantine sources draw a specific
distinction between two parallel treasury offices:

- **Vestiarion** — the treasury of *goods* (your current project name)
- **Sakellion / Sakellarios** — the treasury of *cash*

Sakellarious continues the same historical lineage your product already
claims, but narrows the metaphor: not a warehouse of goods, a **keeper of
the purse**. For an autonomous treasury engine whose entire job is
managing liquid capital, yield, and spend policy, this is a more precise
metaphor than the one it replaces — the rename is a sharpening, not a
departure.

**Design implication:** where v6.0.0 leaned into *industrial hardware* —
rivets, chassis, klaxons, hazard stripes — Sakellarious leans into the
**office itself**: a ledger, a seal, a chapter of accounts, an archive of
record. The aesthetic moves from *factory floor* to *treasury chancery*.

---

## 1. Design Philosophy

**"The Ledger, Not the Machine."**

Where the prior system simulated a physical control panel, Sakellarious
simulates an **illuminated financial record** — restrained, authoritative,
legible at a glance, with just enough ceremony to feel like it's
recording something that matters.

Four principles:

1. **Editorial Restraint.** Large, confident typography and generous
   whitespace carry authority instead of loud chrome, screws, or alarms.
   Silence is a design choice, not an absence of one.
2. **Hairline Precision, Not Heavy Offset.** Structure comes from thin,
   exact rules and precise alignment — not thick borders and blocky
   displacement shadows. Precision reads as competence; bulk reads as
   noise.
3. **Numbered Chapters, Not Dashboard Tiles.** Content is organized as a
   sequence of folios/chapters (inspired structurally — not visually
   copied — by sites like athena3i.vercel.app, which use chaptered
   narrative sections, a scrolling protocol marquee, and numbered module
   blocks). Information unfolds in order, like reading a ledger, rather
   than being scattered across a bento grid of equally-loud cards.
4. **Living Archive.** The page itself should feel occupied — a faint,
   continuous ambient motion behind the content (§6) signals the system
   is alive and working, without competing with the data in front of it.

---

## 2. Color Palette

Byzantine manuscripts and treasury ledgers used a specific, restrained
palette: vellum/parchment grounds, iron-gall ink, imperial porphyry
purple (reserved for the court), and gold leaf for seals and illumination.
This system translates that directly — it deliberately avoids the acid
lime / neon mint / high-voltage palette of v6.0.0.

### 2.1 CSS Variables

```css
:root, [data-theme="ledger"] {
  /* Grounds */
  --bg-page: #0b0a08;            /* Near-black iron-gall, warm not cold */
  --bg-folio: #141210;           /* Chapter/section surface */
  --bg-well: #1c1916;            /* Recessed fields, tables */
  --bg-parchment: #f3ead9;       /* Light-mode / inverted ground */

  /* Structural lines (hairline, not heavy borders) */
  --rule-hairline: rgba(243, 234, 217, 0.14);
  --rule-bright: rgba(243, 234, 217, 0.32);

  /* Ink */
  --ink: #f3ead9;                 /* Primary text — warm parchment white */
  --ink-secondary: #b8ab93;       /* Secondary labels */
  --ink-faint: #756a57;           /* Captions, metadata */

  /* Imperial accents — used sparingly, never decoratively */
  --porphyry: #5b2a6e;            /* Imperial purple — primary accent, authority */
  --gold-leaf: #c9a24b;           /* Seal gold — confirmations, yield, emphasis */
  --verdigris: #4f8a7c;           /* Aged bronze-green — positive/settled states */
  --sigil-red: #8c2f2f;           /* Wax-seal red — alerts, violations, reverts */

  /* Radius — small and consistent, not zero, not soft */
  --radius: 3px;
}

[data-theme="parchment"] {
  --bg-page: #f3ead9;
  --bg-folio: #ffffff;
  --bg-well: #eae0ca;
  --rule-hairline: rgba(11, 10, 8, 0.12);
  --rule-bright: rgba(11, 10, 8, 0.28);
  --ink: #16130f;
  --ink-secondary: #534a3b;
  --ink-faint: #8a7f6a;
}
```

### 2.2 Why This Differs From v6.0.0

| v6.0.0 (Vestiarion) | v1.0.0 (Sakellarious) |
|---|---|
| High-voltage acid lime, neon mint, cyber-purple | Muted porphyry, gold leaf, aged verdigris |
| Pure `#000` offset shadows | No offset shadows — hairline rules instead |
| Zero radius everywhere | Small, consistent 3px radius |
| Dual steel/parchment theme toggle | Single warm-dark default, parchment as light mode |

The accent colors are **reserved, not decorative** — gold appears only
for confirmed/settled states and yield figures, porphyry only for
primary actions and headers, never as general UI chrome.

---

## 3. Typography

A manuscript-display serif for headlines, a quiet humanist sans for UI
text, and a monospace for ledger data — deliberately different faces
from v6.0.0's Archivo Black / Space Grotesk pairing, to avoid any visual
overlap:

```
Headlines:    'Fraunces', Georgia, serif        (warm, editorial, has weight)
Body & UI:    'General Sans', -apple-system, sans-serif
Ledger Data:  'JetBrains Mono', Courier, monospace
```

### 3.1 Type Classes

| Class | Font | Size | Weight / Line-height | Treatment | Usage |
|---|---|---|---|---|---|
| `.text-folio-title` | Fraunces | `clamp(2.2rem, 5vw, 4rem)` | 480 / 1.0 | Normal case, tight tracking | Chapter/section openers |
| `.text-display` | Fraunces | `clamp(1.5rem, 3vw, 2.2rem)` | 440 / 1.1 | Normal case | Sub-section headers |
| `.text-heading` | General Sans | `0.95rem` | 600 / 1.3 | `+0.06em` / UPPERCASE | Card headers, table heads |
| `.text-body` | General Sans | `0.95rem` | 400 / 1.6 | Normal | Narrative explanation |
| `.text-ledger` | JetBrains Mono | `0.85rem` | 500 / 1.4 | Tabular nums | Balances, addresses, hashes |
| `.text-folio-number` | JetBrains Mono | `0.75rem` | 600 / 1.2 | `+0.1em` / UPPERCASE | Chapter numbering (e.g. `FOLIO 01`) |

No all-caps headline shouting — Fraunces headlines stay in normal case.
Only structural/navigational labels (folio numbers, table heads) use
uppercase tracking, which keeps the emphasis hierarchy clear.

---

## 4. Layout — Chaptered Folios, Not Bento Tiles

Structurally, this is the system's biggest departure from v6.0.0's bento
grid, and the part most directly informed by the chaptered, marquee-driven
structure observed on athena3i.vercel.app:

### 4.1 The Marquee Ledger-Line

A single continuous horizontal ticker, used sparingly (once per major
page transition, not persistently), styled as a scribe's running
annotation rather than a crypto-protocol repeat-chant:

```html
<div class="sak-marquee">
  <span>SAKELLION · LIVE ARC L1 SETTLEMENT · SAKELLION · LIVE ARC L1 SETTLEMENT ·</span>
</div>
```
```css
.sak-marquee {
  overflow: hidden;
  white-space: nowrap;
  border-top: 1px solid var(--rule-hairline);
  border-bottom: 1px solid var(--rule-hairline);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  color: var(--ink-faint);
  padding: 10px 0;
}
.sak-marquee span {
  display: inline-block;
  animation: sak-scroll 38s linear infinite;
}
@keyframes sak-scroll {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
```

### 4.2 Folio Sections

Content unfolds as numbered folios, each a full-width editorial section
with a large chapter title, not a grid cell:

```html
<section class="sak-folio">
  <div class="sak-folio__number">FOLIO 01</div>
  <h2 class="text-folio-title">The Commitment</h2>
  <p class="text-body">…</p>
</section>
```
```css
.sak-folio {
  max-width: 740px;
  margin: 0 auto;
  padding: 96px 24px;
  border-top: 1px solid var(--rule-hairline);
}
.sak-folio__number {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  color: var(--gold-leaf);
  margin-bottom: 12px;
}
```

### 4.3 The Treasury Summary (replaces the Hero Bento Deck)

One wide folio near the top of the page holds the live treasury figures
— but as a quiet ledger table with hairline row dividers, not a glowing
dashboard card:

```
┌─────────────────────────────────────────────┐
│ FOLIO 00 — THE LEDGER AT A GLANCE             │
│                                                │
│  Total Treasury .............  $34,880.00     │
│  Liquid Operating ...........  28.3%          │
│  USYC Vault ..................  71.7%          │
│  Runway ......................  214 days       │
├─────────────────────────────────────────────┤  ← hairline, not bold border
│  [AUTONOMOUS YIELD SWEEP]   [EMERGENCY REDEEM] │
└─────────────────────────────────────────────┘
```

---

## 5. Components

### 5.1 Primary Button (`.sak-btn`)
```css
.sak-btn {
  background: transparent;
  border: 1px solid var(--rule-bright);
  border-radius: var(--radius);
  color: var(--ink);
  font-family: var(--font-ui);
  font-size: 0.85rem;
  letter-spacing: 0.03em;
  padding: 12px 22px;
  transition: border-color 0.2s ease, background 0.2s ease;
}
.sak-btn:hover {
  border-color: var(--gold-leaf);
  background: rgba(201, 162, 75, 0.06);
}
.sak-btn--primary {
  background: var(--porphyry);
  border-color: var(--porphyry);
  color: var(--bg-parchment);
}
.sak-btn--primary:hover {
  background: #6d3485;
}
```
No offset-shadow press animation — hover/active states shift via color
and a 1px border change only. This is the clearest behavioral break from
v6.0.0's "tactile hardware" interaction language.

### 5.2 Seal Badge (`.sak-seal`) — replaces the Rubber Stamp
A quieter, circular wax-seal motif instead of a rectangular rubber stamp,
used for status/certification marks:
```css
.sak-seal {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--rule-bright);
  border-radius: 999px;
  padding: 4px 12px;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  color: var(--gold-leaf);
}
.sak-seal--settled { color: var(--verdigris); border-color: var(--verdigris); }
.sak-seal--violation { color: var(--sigil-red); border-color: var(--sigil-red); }
```

### 5.3 Ledger Table (`.sak-table`)
Replaces bento stat-matrix cards for anything tabular — hairline row
rules, tabular-num monospace figures, no zebra striping (manuscripts
don't zebra-stripe; a single hairline per row is enough):
```css
.sak-table td, .sak-table th {
  border-bottom: 1px solid var(--rule-hairline);
  padding: 10px 4px;
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}
```

---

## 6. The Living Background — Ambient Ledger Wallpaper

This directly answers the "live background wallpaper running behind"
requirement. It must run continuously behind *all* page content, stay
visually quiet enough not to compete with text, and stop (or calm down)
for users with reduced-motion preferences.

### 6.1 Concept
A slow, continuous canvas animation simulating **drifting ledger-grain** —
faint parchment texture noise plus a very slow-moving grid of hairline
accounting rules, with occasional soft gold motes drifting upward like
dust caught in chancery light. Not particles-as-data-nodes (that's the
"circuit schematic" language of v6.0.0) — this is ambient texture, not a
diagram.

### 6.2 Implementation
```html
<canvas id="sak-wallpaper" aria-hidden="true"></canvas>
```
```css
#sak-wallpaper {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.5;
}
#app {
  position: relative;
  z-index: 1; /* all real content sits above the wallpaper */
}
```
```javascript
const canvas = document.getElementById('sak-wallpaper');
const ctx = canvas.getContext('2d');
let w, h, motes = [];

function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const MOTE_COUNT = 40;
for (let i = 0; i < MOTE_COUNT; i++) {
  motes.push({
    x: Math.random() * w,
    y: Math.random() * h,
    r: 0.6 + Math.random() * 1.4,
    speed: 0.08 + Math.random() * 0.15,
    drift: (Math.random() - 0.5) * 0.08,
    alpha: 0.05 + Math.random() * 0.12,
  });
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function drawGrid() {
  ctx.strokeStyle = 'rgba(243,234,217,0.025)';
  ctx.lineWidth = 1;
  const gap = 64;
  for (let x = 0; x < w; x += gap) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += gap) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
}

function tick() {
  ctx.clearRect(0, 0, w, h);
  drawGrid();
  for (const m of motes) {
    ctx.beginPath();
    ctx.fillStyle = `rgba(201,162,75,${m.alpha})`; // gold-leaf motes
    ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
    ctx.fill();
    if (!prefersReducedMotion) {
      m.y -= m.speed;
      m.x += m.drift;
      if (m.y < -4) { m.y = h + 4; m.x = Math.random() * w; }
    }
  }
  requestAnimationFrame(tick);
}
tick();
```

### 6.3 Performance & Accessibility Rules
- **Single canvas, single `requestAnimationFrame` loop** — never
  multiple competing animation loops per component.
- **`prefers-reduced-motion: reduce`** freezes mote drift entirely; the
  grid and motes still render as a static texture, so the background
  never fully disappears, it just stops moving.
- **Cap mote count at 40–60** — this is ambient texture, not a particle
  showcase; more motes add GPU cost without adding perceptible value.
- **`opacity: 0.5` on the canvas element itself** (not per-shape alpha
  alone) ensures the whole layer stays visually recessive against
  foreground content regardless of what's drawn on it.
- **`z-index: 0` with all real UI at `z-index: 1`+** — the wallpaper
  must never be able to visually compete with or obscure interactive
  elements.
- On low-end devices, consider dropping `MOTE_COUNT` to ~15 and the grid
  entirely below a `matchMedia('(max-width: 480px)')` check — ambient
  motion is a nice-to-have, not worth janking a budget phone.

---

## 7. What Carries Over From v6.0.0, and What Doesn't

| Element | v6.0.0 | v1.0.0 (Sakellarious) |
|---|---|---|
| Live treasury/yield telemetry concept | Kept, but as quiet ledger-table numbers, not glowing tickers | ✅ Carried over, restyled |
| Sanctions screening, policy caps, escalation queue | Fully kept — this is product logic, not visual style | ✅ Unchanged functionally |
| Rivets, screws, hazard stripes | — | ❌ Dropped entirely |
| Klaxon alarms, stamp-thud audio | — | Optional — see §8, softened if kept |
| Zero-radius / offset-shadow brutalism | — | ❌ Replaced with hairline rules + 3px radius |
| Bento grid dashboard layout | — | ❌ Replaced with chaptered folio layout |
| Dual theme engine | Kept conceptually | ✅ Kept (`ledger` dark / `parchment` light) |

---

## 8. Audio (Optional, Softened)

If sound is kept at all, it should feel like a quill or a seal, not
machinery:
- **Folio turn (`pageTurn`):** soft filtered noise burst, paper-like, under 80ms.
- **Seal confirm (`sealConfirm`):** single low thud, far gentler than v6.0.0's
  dual-layer pneumatic stamp — think wax seal pressed, not factory press.
- **Alert (`alert`):** a single low bell tone, not a dual-tone klaxon.

Skip the mechanical relay click and knife-switch clunk entirely — those
belong to the hardware metaphor this system deliberately retires.

---

## 9. Key Invariants

1. **No offset drop-shadows.** Structure comes from `--rule-hairline` /
   `--rule-bright` borders only.
2. **Radius is always `var(--radius)` (3px).** Never 0, never fully
   rounded except `.sak-seal`'s pill shape.
3. **Accent colors (porphyry, gold, verdigris, sigil-red) are earned, not
   decorative** — each maps to one specific semantic state and is never
   used purely for visual variety.
4. **The wallpaper (§6) never exceeds `opacity: 0.5`** and always
   respects `prefers-reduced-motion`.
5. **Content is chaptered, not tiled.** Default to a single-column folio
   sequence; only break into a multi-column table/grid when the content
   is genuinely tabular (the treasury summary, allowance meters).
6. **Typography carries the hierarchy.** Before reaching for a new
   color, bold weight, or badge, ask whether a type-scale change (§3)
   already solves it.
