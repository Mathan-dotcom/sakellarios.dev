# 🧱 Meridian Design System & Styleguide

> **Design Direction:** Concrete Brutalism
> **Brand Identity:** High-Precision Autonomous Financial Mission Control
> **Theme:** `data-theme="meridian"`
> **Version:** 3.0.0 (September 2026) — converted from v2.0.0 Neumorphism

---

### What changed from v2.0.0

Meridian keeps its identity — financial mission control, tri-font hierarchy, semantic state colors — but the surface language moves from **soft-extruded matte plastic** to **raw poured concrete**. Panels are no longer molded out of the background with paired shadows; they are **explicit objects** bolted onto the page: thick black borders, hard offset shadows with zero blur, zero border-radius, and visible structural seams. Where neumorphism whispered "a single block of material, carved and pressed," brutalism states it plainly: **"a wall, a label, a warning."** Depth is not simulated light — depth is *architecture*. Every element declares what it is with a border, a stamp, or a number. Nothing is hidden; nothing pretends to float.

---

## 1. Design Philosophy

Meridian's aesthetic is built on the concept of **"A Heartbeat, Not a Homepage"** — now rendered in concrete:

- **Raw Concrete Surfaces:** Every surface is an honest slab of light concrete (`#d9d9d7`) or cast-black steel (`#111113`). No gradients, no blur, no translucency, no simulated light. Texture comes from *material honesty*, not illusion.
- **Structure Is the Decoration:** Exposed 1px grid lines, thick 2–3px object borders, visible seams between modules, and index-numbered sections replace decorative chrome. The layout itself is the ornament.
- **Stamp, Don't Style:** Status is communicated through stamped labels, hazard stripes, rubber-stamp rotations (`rotate(-2deg)`), and inverted blocks — the visual language of industrial safety signage, not UI polish.
- **Kinetic Brutal Motion:** Marquee tickers, glitch-cut transitions, hard-stepped easing (`steps()`), and blinking block cursors provide constant visual feedback of a living, autonomous system. Motion snaps; it never eases like liquid.
- **Typographic Discipline:** A tri-font hierarchy blending monumental condensed display type for numbers with neutral grotesque for interface labels and strict monospace for audit ledgers.

---

## 2. Color Palette & Token System

Brutalism needs **flat, honest color** — full-strength inks on raw substrate. Where neumorphism derived meaning from shadow direction, brutalism derives meaning from **ink coverage and accent saturation**. Semantic states keep their v1.0.0 logic but are re-expressed as *safety-signage colors* on the monochrome base.

### 2.1 CSS Variables (`:root`)

```css
:root, [data-theme="pulse"], [data-theme="meridian"] {
  /* Substrates — the concrete itself */
  --concrete: #d9d9d7;              /* Primary page substrate — raw light concrete */
  --concrete-dark: #c9c9c6;         /* Secondary substrate — poured shadow-side concrete */
  --steel: #111113;                 /* Inverted panels — cast black steel */

  /* Ink & Structure */
  --ink-hard: #0a0a0b;              /* Primary ink — blue-black India ink */
  --ink-soft: #3f3f46;              /* Secondary ink — technical pencil gray */
  --hairline: rgba(10, 10, 11, 0.25); /* Exposed grid lines & structural seams */

  /* Offset Shadow — hard, zero blur, zero spread softness */
  --bru-shadow: #0a0a0b;            /* Solid offset shadow — depth as architecture, not light */

  /* Semantic State Colors — safety-signage accents */
  --recovered: #0a0a0b;             /* Settled/recovered — solid black stamp on white */
  --recovered-accent: #ffffff;      /* Inverted badge fill */
  --recovered-mark: #00c853;        /* OK green — the only "green light" in the system */

  --at-risk: #111113;
  --at-risk-accent: #ffb300;        /* Hazard amber — queued incidents, pending actions */

  --critical: #ffffff;
  --critical-accent: #ff2e2e;       /* Signal red — outages, fallback paths, aborts */

  --signal: #0a0a0b;
  --signal-accent: #2e5bff;         /* Blueprint blue — active pulse nodes, primary focus */

  /* Financial Ledgers */
  --ledger: #0a0a0b;
  --ledger-muted: #6b6b70;

  /* Radius — none. Brutalism does not round corners. */
  --radius-pulse: 0px;
  --radius-pulse-sm: 0px;
}
```

### 2.2 Color Tokens & Intent

| Token | Hex | Role & Visual Intent |
| :--- | :--- | :--- |
| `--concrete` | `#d9d9d7` | Page background. Raw light concrete — never pure white; concrete has grain and age. |
| `--concrete-dark` | `#c9c9c6` | Alternating substrate rows, zebra striping, recessed wells — the shadow side of the pour. |
| `--steel` | `#111113` | Inverted panels, header bars, footer slabs — cast black steel bolted onto the concrete. |
| `--ink-hard` | `#0a0a0b` | All primary borders (2–3px), primary text, hard offset shadows. |
| `--hairline` | `rgba(10,10,11,0.25)` | Exposed 1px grid lines and module seams — structure made visible. |
| `--bru-shadow` | `#0a0a0b` | Solid `Npx Npx 0` offset shadows. Zero blur, zero alpha. Depth = displacement, not light. |
| `--recovered-mark` | `#00c853` | Settled payments, confirmed recoveries. Used sparingly — a stamp, not a wash. |
| `--at-risk-accent` | `#ffb300` | Degraded rails, queued incidents, pending gates. Hazard amber on black or ink on amber. |
| `--critical-accent` | `#ff2e2e` | Outages, rollbacks, aborts. Highest urgency — may be the only full-bleed color fill allowed. |
| `--signal-accent` | `#2e5bff` | Active nodes, primary actions, focus rings. Blueprint blue — the color of the plan itself. |
| `--ledger-muted` | `#6b6b70` | Secondary metadata, timestamps, protocol schemas. Pencil gray, always monospace. |

**Accent discipline:** accents are *fills for stamps and stripes*, never background washes. A `--critical-accent` element is a red block with black ink — not a light red panel with dark text.

---

## 3. Typography System

Meridian combines three distinct Google Fonts loaded with `display: swap` for instant zero-layout-shift rendering. The serif is retired — brutalism speaks in **industrial condensed grotesque**:

```
Archivo Black      Space Grotesk        IBM Plex Mono
(Monumental Display) (Technical UI)      (Financial Monospace)
"₹1.08 CR"         "WAR ROOM CONSOLE"   "ERR: 86,660 | 94.2% CONF"
```

### 3.1 Font Family Mapping

| Role | Font Family | Variable | Usage |
| :--- | :--- | :--- | :--- |
| **Display** | `Archivo Black` | `--font-display` | Large revenue statistics, hero headings, financial metrics. Set in ALL CAPS, tight tracking, occasionally `rotate(-1.5deg)` as a rubber stamp. |
| **UI & Headings** | `Space Grotesk` | `--font-ui` | Body copy, section titles, buttons, navigation, badges. |
| **Data & Ledger** | `IBM Plex Mono` | `--font-mono` | Audit trail timestamps, error codes, ERR formulas, section index numbers, code. |

### 3.2 Typography Scale & Utility Classes

```css
/* Hero Numbers & Statements */
.text-display-xl {
  font-family: var(--font-display);
  font-size: clamp(3.5rem, 9vw, 6.5rem);
  line-height: 0.9;              /* monumentally tight */
  font-weight: 900;
  letter-spacing: -0.03em;
  text-transform: uppercase;
}

/* Section Hero Numbers */
.text-display-md {
  font-family: var(--font-display);
  font-size: 2.5rem;
  line-height: 0.95;
  font-weight: 900;
  letter-spacing: -0.02em;
  text-transform: uppercase;
}

/* Card & Section Headings — prefixed with index numbers: "01 / GATEWAY RAILS" */
.text-heading {
  font-family: var(--font-ui);
  font-size: 1.25rem;
  line-height: 1.2;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Body & Explanations */
.text-body {
  font-family: var(--font-ui);
  font-size: 0.9375rem;
  line-height: 1.55;
  font-weight: 400;
  max-width: 68ch;               /* honest measure, never full-bleed */
}

/* Numbers, Values & Statistics */
.text-data {
  font-family: var(--font-mono);
  font-size: 0.875rem;
  line-height: 1.4;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

/* Captions, Subtext, Stamps & Badges */
.text-micro {
  font-family: var(--font-ui);
  font-size: 0.75rem;
  line-height: 1.3;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
```

### 3.3 Universal Text Alignment Standard
Body copy stays left-aligned with a ragged-right edge — justification is a typesetter's polish; concrete is honest about its rag. Headings and stamps never wrap awkwardly: they are sized with `clamp()` to fit on one line or break hard.

```css
p, .text-body, .card-description {
  text-align: left;
  max-width: 68ch;
  text-wrap: pretty;
}
```

---

## 4. Brutalist Elevation & Surface Architecture

Meridian panels are **bolted on, not molded**. Every surface is defined by a **visible ink border** and an optional **hard offset shadow** — no blur, no alpha, no rounded corners, no dual-light illusion. Convex vs. recessed reads not from shadow direction but from **border weight and shadow displacement**: an offset shadow says "this object sits in front"; an inset border says "this area is carved out."

### 4.1 Base Panel (`.bru-panel`)
Used for static sections, structural grids, and containers — reads as a concrete slab framed in ink:
```css
.bru-panel {
  background: var(--concrete);
  border: 2px solid var(--ink-hard);
  border-radius: 0;
  box-shadow: none;
}
```

### 4.2 Raised / Floating Panel (`.bru-panel-raised`)
Used for modals, tooltips, and top-layer drawers — depth is pure displacement: a solid offset shadow thrown down-right, as if the slab is physically lifted and casting a hard architectural shadow:
```css
.bru-panel-raised {
  background: var(--concrete);
  border: 3px solid var(--ink-hard);
  border-radius: 0;
  box-shadow: 10px 10px 0 var(--bru-shadow);
}
```

### 4.3 Stamp / Status Tag (`.bru-stamp`)
Used for badges, status chips, and protocol tags — rectangular labels with heavy borders, uppercase micro type, and optional hazard-stripe fills. May be rotated ±2° like a rubber stamp; may invert to black-on-accent:
```css
.bru-stamp {
  display: inline-block;
  padding: 4px 10px;
  background: var(--concrete);
  border: 2px solid var(--ink-hard);
  border-radius: 0;
  box-shadow: 3px 3px 0 var(--bru-shadow);
  font-family: var(--font-ui);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.bru-stamp--inverted { background: var(--ink-hard); color: var(--concrete); }
.bru-stamp--hazard   { background: repeating-linear-gradient(
                         -45deg, var(--at-risk-accent) 0 8px, var(--ink-hard) 8px 16px); }
```

### 4.4 Recessed Well (`.bru-well`)
Used for input fields, search bars, read-only logs — the concrete shadow-side pour, differentiated by a **darker substrate and dashed inner seam** rather than any shadow trick:
```css
.bru-well {
  background: var(--concrete-dark);
  border: 2px solid var(--ink-hard);
  border-radius: 0;
  box-shadow: inset 0 0 0 1px var(--hairline);  /* a scored groove, not a shadow */
}
```

### 4.5 Exposed Structure Utilities
```css
.bru-grid-lines {
  background-image:
    linear-gradient(var(--hairline) 1px, transparent 1px),
    linear-gradient(90deg, var(--hairline) 1px, transparent 1px);
  background-size: 48px 48px;   /* blueprint grid, worn into the concrete */
}
.bru-seam-top    { border-top: 2px solid var(--ink-hard); }
.bru-index::before {
  content: attr(data-index);    /* "01" — every section is numbered */
  font-family: var(--font-mono);
  color: var(--ink-soft);
  margin-right: 0.75rem;
}
```

---

## 5. Interaction & Motion System

### 5.1 Card Interaction (`.card-hover`)
Brutalist cards **lift architecturally on hover** — the offset shadow grows, and the slab shifts up-left against it. On click, the shadow **collapses to zero** and the card slams down into the page. Transitions are quick and mechanical (`cubic-bezier(0.2, 0, 0, 1)` at ~150ms); there is no soft float:

```css
.card-hover {
  transition: transform 0.15s cubic-bezier(0.2, 0, 0, 1),
              box-shadow 0.15s cubic-bezier(0.2, 0, 0, 1);
  will-change: transform, box-shadow;
  position: relative;
}

.card-hover:hover {
  transform: translate(-4px, -4px);
  box-shadow: 12px 12px 0 var(--bru-shadow);
  z-index: 20;
}

.card-hover:active {
  transform: translate(0, 0);
  box-shadow: 0 0 0 var(--bru-shadow);
}
```

### 5.2 Button Hierarchy

#### Secondary Brut Button (`.bru-button`)
```css
.bru-button {
  background: var(--concrete);
  border: 2px solid var(--ink-hard);
  border-radius: 0;
  box-shadow: 5px 5px 0 var(--bru-shadow);
  color: var(--ink-hard);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  transition: transform 0.12s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.12s cubic-bezier(0.2, 0, 0, 1);
}
.bru-button:hover {
  transform: translate(-2px, -2px);
  box-shadow: 7px 7px 0 var(--bru-shadow);
}
.bru-button:active {
  transform: translate(0, 0);
  box-shadow: 0 0 0 var(--bru-shadow);
}
```

#### Primary Accent Action Button (`.bru-button-primary`)
Primary actions **invert**: black slab, concrete text, blueprint-blue offset shadow — the emphasized choice reads as the heaviest object on the page:
```css
.bru-button-primary {
  background: var(--ink-hard);
  color: var(--concrete);
  border: 2px solid var(--ink-hard);
  border-radius: 0;
  box-shadow: 5px 5px 0 var(--signal-accent);
  font-weight: 700;
  text-transform: uppercase;
}
.bru-button-primary:hover {
  transform: translate(-2px, -2px);
  box-shadow: 8px 8px 0 var(--signal-accent);
}
.bru-button-primary:active {
  transform: translate(0, 0);
  box-shadow: 0 0 0 var(--signal-accent);
}
```

#### Focus State (non-negotiable)
```css
.bru-button:focus-visible,
.card-hover:focus-visible {
  outline: 3px solid var(--signal-accent);
  outline-offset: 2px;
}
```

### 5.3 Keyframe Animations

#### Recovery Stamp (`@keyframes recoveryStamp`)
A successful recovery is confirmed with a **rubber-stamp slam** — the confirmation block drops in from above with one hard step and a shake, then settles with a 2° rotation. No glow; impact:
```css
@keyframes recoveryStamp {
  0%   { transform: translateY(-24px) rotate(0deg) scale(1.4); opacity: 0; }
  60%  { transform: translateY(2px)  rotate(-2deg) scale(0.98); opacity: 1; }
  80%  { transform: translateY(-1px) rotate(-1deg) scale(1.01); }
  100% { transform: translateY(0)    rotate(-2deg) scale(1); }
}
```

#### Rollback Flinch (`@keyframes rollbackFlinch`)
Kept from v1.0.0 but **harshened** — a hard two-step shake, the motion equivalent of an industrial alarm:
```css
@keyframes rollbackFlinch {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  50% { transform: translateX(6px); }
  75% { transform: translateX(-3px); }
}
```

#### Critical Alert (`@keyframes criticalBlink`)
Full-block inversion blink for critical panels — the only allowed "glow" substitute:
```css
@keyframes criticalBlink {
  0%, 49%  { background: var(--critical-accent); color: var(--ink-hard); }
  50%, 100%{ background: var(--ink-hard);        color: var(--critical-accent); }
}
```

---

## 6. Signature Visual Components

### 6.1 Transaction Flow Matrix (`FlowMatrix`)
- **Technology:** HTML5 2D Canvas with requestAnimationFrame.
- **Visual:** 70+ nodes on a **visible blueprint grid** (not floating over void), connected by hard 1px ink lines — a circuit diagram, not a particle field.
- **Dynamic Physics:** During failure spikes, connecting lines **flash hazard-amber** and nodes enlarge into squares. On confirmed recovery, the affected route stamps a solid green block and the trace locks to the grid.
- **Styling:** nodes are squares (`fillRect`), never circles; no anti-aliased glows.

### 6.2 Immutable Terminal Audit Ledger (`AuditTrail`)
- **Style:** Monospace command-line output inside a `.bru-well` with **hard zebra striping** (`--concrete` / `--concrete-dark`) — the log reads like a printed industrial run-sheet, not a screen glow.
- **Row prefix:** every entry is prefixed with a monospace index (`#0042`) and a status stamp (`[OK]` / `[WARN]` / `[ABORT]`).
- **Colors:** status is stamped — black-on-white `OK`, ink-on-amber `WARN`, blinking `criticalBlink` on `ABORT`. Hashes and timestamps in `--ledger-muted`.
- **Header:** A black steel bar (`background: var(--steel)`) with an uppercase white title, live block-cursor blink (`▮`), and a section index number.

### 6.3 Confidence & Autonomy Gauge (`ConfidenceGate`)
- **Visual:** Replaces the circular SVG meter with a **segmented horizontal block bar** inside a `.bru-panel` — ten solid cells, each 2px-separated, filling left to right toward the Bayesian Autonomy Gate (≥ 0.70 threshold).
- **Threshold marker:** A vertical ink line at the 70% position with a rotated micro-label: `▲ AUTONOMY GATE — 0.70`.
- **Color Progression:** concrete → ink-hard → blueprint blue as confidence crosses the gate; below 0.40 the filled cells are hazard-amber. The 10th segment, when filled, stamps `AUTO` in `--recovered-mark`.

---

## 7. Component Usage Checklist

When building new components for Meridian:
- [ ] Use `font-ui` (`Space Grotesk`) for titles and controls — always uppercase for headings and buttons.
- [ ] Use `font-display` (`Archivo Black`) for primary financial numbers and tickers — uppercase, tight leading, monumental scale.
- [ ] Use `font-mono` (`IBM Plex Mono`) for hashes, IDs, error codes, index numbers, and formula parameters.
- [ ] Set `border-radius: 0` everywhere. **No rounded corners, no exceptions.**
- [ ] Give every panel a visible `border: 2px solid var(--ink-hard)` (3px for raised). Depth comes only from the `Npx Npx 0 var(--bru-shadow)` offset — zero blur.
- [ ] Use `.bru-well` (dark substrate + scored groove) for anything recessed: inputs, search bars, read-only logs.
- [ ] Use `.bru-panel-raised` (heavy border + 10px offset shadow) for anything floating: cards, modals, buttons.
- [ ] Wrap clickable cards in `.card-hover` with `.bru-panel`; never use soft transitions longer than ~200ms.
- [ ] Number every section with a monospace index (`01`, `02`…) via `.bru-index`.
- [ ] Keep accent colors strictly within the safety-signage set (hazard amber, signal red, blueprint blue, OK green) — and use them as stamps and stripes, never as washes.
- [ ] Expose structure: grid lines, seams, and hairlines are features. If a divider isn't visible, add one.
