# 🟨 Kiln Design System & Styleguide

> **Design Direction:** Neo-Brutalism (Loud Poster Brutalism)
> **Brand Identity:** Independent Creator Storefront & Limited-Drop Platform
> **Theme:** `data-theme="kiln"`
> **Version:** 1.0.0 (October 2026) — companion to the Meridian *Concrete Brutalism* guide

---

### How Kiln relates to Meridian

Both systems share the same brutalist DNA: **zero border-radius, thick ink borders, hard offset shadows with zero blur, exposed structure, and snap-only motion.** They differ in *temperament*.

| | **Meridian (Concrete)** | **Kiln (Neo-Brutalist)** |
| :--- | :--- | :--- |
| Mood | Industrial, sober, mission control | Loud, playful, poster / zine / sticker sheet |
| Substrate | Gray concrete `#d9d9d7` | Warm raw paper `#fff6e0` |
| Color | Monochrome + safety-signage accents | Saturated flat fills used as full-bleed blocks |
| Display type | Archivo Black, condensed | Bricolage Grotesque ExtraBold, wide & chunky |
| Shadow | Black only (blue on primary) | Black by default; **colored shadows** allowed on hover |
| Tone | "A wall, a label, a warning." | "A sticker, a poster, a dare." |

Kiln keeps the honesty of brutalism — nothing floats, nothing pretends — but trades warning-sign severity for **printed-matter exuberance**: color is allowed to shout, as long as it stays flat and boxed in ink.

---

## 1. Design Philosophy

Kiln is built on the concept of **"Fired, Not Finished"** — things look like they just came out of the kiln: heavy, a little crooked, deliberately unpolished.

- **Flat Color Blocks:** Every surface is a single, solid fill. No gradients, no blur, no translucency, no glassmorphism. Color is applied like screen-print ink — full strength, edge to edge.
- **Ink Outlines on Everything:** If it's an object, it has a 3px black outline. The outline is the component. Remove it and the component stops existing.
- **Sticker Logic:** Cards, tags, and badges behave like physical stickers: slightly rotated (`±1–3deg`), stacked, overlapping, peeling toward the cursor on hover.
- **Paper Grain Over Pixels:** Backgrounds are warm paper with a faint dot grid. The page should feel *printed*, not rendered.
- **Snap Motion:** Hover lifts, press slams. Easing is mechanical and fast (≤150ms). Marquees, wiggles, and stepped animations only — never liquid easing.
- **Big Type, Short Words:** Headlines are enormous, tightly leaded, and written in blunt, few-word statements: **DROP IT. OWN IT. SHIP IT.**

---

## 2. Color Palette & Token System

Kiln uses **flat, saturated "ink" colors** on a **warm paper substrate**. Accent colors are assigned *roles*, not moods — each one means one thing everywhere.

### 2.1 CSS Variables (`:root`)

```css
:root, [data-theme="kiln"] {
  /* Substrates — the paper */
  --paper:        #fff6e0;   /* Primary page background — warm raw paper */
  --paper-dark:   #f0e4c3;   /* Recessed areas, zebra rows, input wells */
  --paper-white:  #ffffff;   /* Cards that must pop off the page */

  /* Ink & Structure */
  --ink:          #14110f;   /* Primary ink — warm black. Text, borders, shadows */
  --ink-soft:     #4a443d;   /* Secondary text */
  --ink-faint:    rgba(20, 17, 15, 0.18);  /* Dot grid & hairlines */

  /* Offset Shadow — hard, zero blur */
  --shadow:       #14110f;

  /* Role Colors — flat screen-print inks */
  --yellow:       #ffe14d;   /* PRIMARY — highlights, hero blocks, "new" */
  --pink:         #ff6fae;   /* SALE / LIVE — drops, discounts, hot items */
  --cyan:         #4dd8ff;   /* INFO — links, tips, neutral emphasis */
  --lime:         #b6f23d;   /* SUCCESS — sold, confirmed, in stock */
  --violet:       #a78bff;   /* CREATOR — profiles, badges, membership */
  --orange:       #ff8a3d;   /* WARNING — low stock, pending, ending soon */
  --red:          #ff4d4d;   /* ERROR — failed, sold out, destructive */

  /* Radius — none. */
  --radius:       0px;
  --radius-sm:    0px;

  /* Border weights */
  --bw:           3px;       /* Standard object border */
  --bw-heavy:     4px;       /* Raised / hero objects */
  --bw-thin:      2px;       /* Small chips, table cells */
}
```

### 2.2 Color Tokens & Intent

| Token | Hex | Role & Visual Intent |
| :--- | :--- | :--- |
| `--paper` | `#fff6e0` | Page background. Warm, slightly yellow — never pure white. |
| `--paper-dark` | `#f0e4c3` | Wells, inputs, alternating rows — the "pressed" side of the paper. |
| `--paper-white` | `#ffffff` | Product cards and modals that need maximum contrast against the page. |
| `--ink` | `#14110f` | All borders, text, and hard shadows. The one and only line color. |
| `--yellow` | `#ffe14d` | Primary brand fill. Hero blocks, primary buttons, highlighter underlines. |
| `--pink` | `#ff6fae` | Live drops, sales, hot/trending items. The loudest role — use once per view. |
| `--cyan` | `#4dd8ff` | Informational callouts, links on hover, neutral tags. |
| `--lime` | `#b6f23d` | Success states: purchase complete, restock, "in stock" stamps. |
| `--violet` | `#a78bff` | Creator identity: profile headers, verified badges, membership tiers. |
| `--orange` | `#ff8a3d` | Warnings: low stock, countdown under 1h, pending payout. |
| `--red` | `#ff4d4d` | Errors and destructive actions: failed payment, delete, sold out. |

**Accent discipline:** colors are **flat fills inside an ink outline**. Never use a tinted background with colored text, never use a color at partial opacity, never put two saturated fills adjacent without an ink border between them. Text on any role color is always `--ink`.

---

## 3. Typography System

Three Google Fonts, loaded with `display: swap`. Kiln speaks in **fat, friendly grotesque** — big where it matters, plain everywhere else.

```
Bricolage Grotesque    DM Sans            JetBrains Mono
(Chunky Display)       (Friendly UI)      (Data & Receipts)
"NEW DROP FRIDAY"      "Add to cart"      "ORD-00421 · ₹1,499"
```

### 3.1 Font Family Mapping

| Role | Font Family | Variable | Usage |
| :--- | :--- | :--- | :--- |
| **Display** | `Bricolage Grotesque` (800) | `--font-display` | Hero headlines, prices, countdowns, section titles. Often set in ALL CAPS with a highlighter underline. |
| **UI & Body** | `DM Sans` (400 / 500 / 700) | `--font-ui` | Body copy, buttons, nav, form labels, descriptions. |
| **Data & Receipts** | `JetBrains Mono` | `--font-mono` | Order IDs, SKUs, timestamps, edition numbers (`#042/100`), code. |

### 3.2 Typography Scale & Utility Classes

```css
/* Hero Headline */
.text-hero {
  font-family: var(--font-display);
  font-size: clamp(3rem, 10vw, 7.5rem);
  line-height: 0.88;
  font-weight: 800;
  letter-spacing: -0.04em;
  text-transform: uppercase;
}

/* Section Title */
.text-title {
  font-family: var(--font-display);
  font-size: clamp(2rem, 5vw, 3.25rem);
  line-height: 0.95;
  font-weight: 800;
  letter-spacing: -0.03em;
  text-transform: uppercase;
}

/* Card Heading */
.text-heading {
  font-family: var(--font-display);
  font-size: 1.375rem;
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: -0.01em;
}

/* Body */
.text-body {
  font-family: var(--font-ui);
  font-size: 1rem;
  line-height: 1.6;
  font-weight: 400;
  max-width: 62ch;
}

/* Price / Numbers */
.text-price {
  font-family: var(--font-display);
  font-size: 2rem;
  line-height: 1;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

/* Data & Receipts */
.text-data {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  line-height: 1.4;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

/* Labels, Tags, Captions */
.text-micro {
  font-family: var(--font-ui);
  font-size: 0.75rem;
  line-height: 1.2;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
```

### 3.3 Highlighter Underline (signature text treatment)
Key words in headlines get a flat color bar behind them — a marker swipe, not an underline:

```css
.hl {
  background: linear-gradient(transparent 55%, var(--yellow) 55% 92%, transparent 92%);
  padding: 0 0.1em;
}
.hl--pink { background-image: linear-gradient(transparent 55%, var(--pink) 55% 92%, transparent 92%); }
.hl--cyan { background-image: linear-gradient(transparent 55%, var(--cyan) 55% 92%, transparent 92%); }
```

### 3.4 Universal Text Alignment Standard
Body copy is left-aligned, ragged right. Hero headlines may be left-aligned or deliberately stacked and offset. Never center long paragraphs.

```css
p, .text-body, .card-description {
  text-align: left;
  max-width: 62ch;
  text-wrap: pretty;
}
```

---

## 4. Surface Architecture

Kiln panels are **stickers on paper**: a flat color fill, a thick ink outline, and a hard offset shadow. Depth equals displacement; hierarchy equals border weight and color.

### 4.1 Base Panel (`.k-panel`)
Static containers, grid cells, content sections:
```css
.k-panel {
  background: var(--paper-white);
  border: var(--bw) solid var(--ink);
  border-radius: 0;
  box-shadow: 6px 6px 0 var(--shadow);
}
```

### 4.2 Flat Panel (`.k-panel-flat`)
For dense layouts where shadows would clutter (tables, nested cards) — outline only:
```css
.k-panel-flat {
  background: var(--paper);
  border: var(--bw-thin) solid var(--ink);
  border-radius: 0;
  box-shadow: none;
}
```

### 4.3 Raised Panel (`.k-panel-raised`)
Modals, drawers, popovers, hero cards — the heaviest objects on the page:
```css
.k-panel-raised {
  background: var(--paper-white);
  border: var(--bw-heavy) solid var(--ink);
  border-radius: 0;
  box-shadow: 12px 12px 0 var(--shadow);
}
```

### 4.4 Color Block (`.k-block`)
Full-color sections and hero cards. Pair with a role modifier:
```css
.k-block {
  border: var(--bw) solid var(--ink);
  box-shadow: 8px 8px 0 var(--shadow);
  color: var(--ink);
}
.k-block--yellow { background: var(--yellow); }
.k-block--pink   { background: var(--pink); }
.k-block--cyan   { background: var(--cyan); }
.k-block--lime   { background: var(--lime); }
.k-block--violet { background: var(--violet); }
```

### 4.5 Sticker Tag (`.k-sticker`)
Badges, status chips, category labels. Rotated slightly, always outlined:
```css
.k-sticker {
  display: inline-block;
  padding: 4px 12px;
  background: var(--yellow);
  border: var(--bw-thin) solid var(--ink);
  border-radius: 0;
  box-shadow: 3px 3px 0 var(--shadow);
  font-family: var(--font-ui);
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  transform: rotate(-2deg);
}
.k-sticker--pink   { background: var(--pink); transform: rotate(2deg); }
.k-sticker--lime   { background: var(--lime); }
.k-sticker--orange { background: var(--orange); transform: rotate(1deg); }
.k-sticker--red    { background: var(--red); }
.k-sticker--ink    { background: var(--ink); color: var(--paper); }
```

### 4.6 Recessed Well (`.k-well`)
Inputs, search bars, read-only fields — darker paper with an inner shadow-free "scored" edge:
```css
.k-well {
  background: var(--paper-dark);
  border: var(--bw-thin) solid var(--ink);
  border-radius: 0;
  box-shadow: inset 4px 4px 0 var(--ink-faint);
  padding: 10px 14px;
  font-family: var(--font-ui);
}
.k-well:focus-within {
  background: var(--paper-white);
  outline: 3px solid var(--cyan);
  outline-offset: 2px;
}
```

### 4.7 Paper Texture & Exposed Structure
```css
body {
  background-color: var(--paper);
  background-image: radial-gradient(var(--ink-faint) 1px, transparent 1px);
  background-size: 20px 20px;           /* dot-grid paper */
}
.k-divider      { border-top: var(--bw) solid var(--ink); }
.k-divider--dashed { border-top: var(--bw-thin) dashed var(--ink); }
.k-index::before {
  content: attr(data-index);            /* "01", "02" … */
  font-family: var(--font-mono);
  margin-right: 0.6rem;
  color: var(--ink-soft);
}
```

---

## 5. Interaction & Motion System

### 5.1 Card Interaction (`.card-hover`)
Cards **lift toward the viewer** on hover (shift up-left, shadow grows) and **slam flat** on press. Hover may swap the shadow to a role color for a punchy reveal:
```css
.card-hover {
  transition: transform 0.12s cubic-bezier(0.2, 0, 0, 1),
              box-shadow 0.12s cubic-bezier(0.2, 0, 0, 1);
  will-change: transform, box-shadow;
}
.card-hover:hover {
  transform: translate(-4px, -4px) rotate(-0.5deg);
  box-shadow: 10px 10px 0 var(--shadow);
}
.card-hover--color:hover {
  box-shadow: 10px 10px 0 var(--pink);   /* optional colored-shadow reveal */
}
.card-hover:active {
  transform: translate(0, 0) rotate(0deg);
  box-shadow: 0 0 0 var(--shadow);
}
```

### 5.2 Button Hierarchy

#### Primary (`.k-button`) — yellow slab
```css
.k-button {
  background: var(--yellow);
  color: var(--ink);
  border: var(--bw) solid var(--ink);
  border-radius: 0;
  box-shadow: 5px 5px 0 var(--shadow);
  padding: 12px 22px;
  font-family: var(--font-ui);
  font-weight: 700;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: transform 0.1s cubic-bezier(0.2, 0, 0, 1),
              box-shadow 0.1s cubic-bezier(0.2, 0, 0, 1);
}
.k-button:hover  { transform: translate(-2px, -2px); box-shadow: 7px 7px 0 var(--shadow); }
.k-button:active { transform: translate(5px, 5px);   box-shadow: 0 0 0 var(--shadow); }
```

#### Secondary (`.k-button-secondary`) — white slab
```css
.k-button-secondary { background: var(--paper-white); }
```

#### Hot (`.k-button-hot`) — pink, for the single most urgent CTA per view
```css
.k-button-hot { background: var(--pink); }
```

#### Destructive (`.k-button-danger`)
```css
.k-button-danger { background: var(--red); }
```

#### Disabled
Disabled buttons lose their shadow and color — they become flat, dashed, and obviously dead:
```css
.k-button:disabled {
  background: var(--paper-dark);
  color: var(--ink-soft);
  border-style: dashed;
  box-shadow: none;
  cursor: not-allowed;
  transform: none;
}
```

#### Focus State (non-negotiable)
```css
.k-button:focus-visible,
.card-hover:focus-visible,
a:focus-visible {
  outline: 4px solid var(--cyan);
  outline-offset: 3px;
}
```

### 5.3 Keyframe Animations

#### Sticker Wiggle (`@keyframes wiggle`)
For new-item badges and attention hooks. Stepped, not smooth:
```css
@keyframes wiggle {
  0%, 100% { transform: rotate(-3deg); }
  50%      { transform: rotate(3deg); }
}
.k-sticker--live { animation: wiggle 0.6s steps(2, end) infinite; }
```

#### Marquee Ticker (`@keyframes marquee`)
A continuous scrolling banner for drops and announcements — the signature Kiln header:
```css
@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.k-marquee {
  background: var(--ink);
  color: var(--yellow);
  border-block: var(--bw) solid var(--ink);
  overflow: hidden;
  white-space: nowrap;
}
.k-marquee__track { display: inline-block; animation: marquee 20s linear infinite; }
```

#### Purchase Slam (`@keyframes slam`)
On successful checkout, a confirmation block drops in with one hard impact:
```css
@keyframes slam {
  0%   { transform: scale(1.6) rotate(-8deg); opacity: 0; }
  60%  { transform: scale(0.96) rotate(-3deg); opacity: 1; }
  100% { transform: scale(1) rotate(-3deg); }
}
```

#### Error Shake (`@keyframes shake`)
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25%      { transform: translateX(-8px); }
  50%      { transform: translateX(8px); }
  75%      { transform: translateX(-4px); }
}
```

#### Countdown Blink (`@keyframes tick`)
Final-minute countdowns flip between pink and ink in hard steps:
```css
@keyframes tick {
  0%, 49%   { background: var(--pink); color: var(--ink); }
  50%, 100% { background: var(--ink);  color: var(--pink); }
}
```

#### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  .k-marquee__track, .k-sticker--live, [class*="animate-"] { animation: none; }
  .card-hover, .k-button { transition: none; }
}
```

---

## 6. Signature Visual Components

### 6.1 Drop Card (`DropCard`)
- **Anatomy:** product image in a 3px ink frame → edition stamp (`#042/100` in mono) → title in display type → price in `.text-price` → full-width `.k-button`.
- **Image treatment:** images are cropped square, hard-edged, with a flat `--cyan` or `--yellow` backing block offset 8px behind them (a printed "misregistration" look). No rounded corners, no drop-shadow filters.
- **Stamps:** `NEW` (yellow), `LIVE` (pink, wiggling), `LOW STOCK` (orange), `SOLD OUT` (red, rotated -6deg across the image).
- **Hover:** card lifts with a pink colored shadow (`.card-hover--color`).

### 6.2 Countdown Timer (`DropClock`)
- **Visual:** four fat boxes (`DD : HH : MM : SS`), each a `.k-panel` with mono numerals in display type, separated by bold colons.
- **States:** default → `--yellow` boxes; under 1 hour → `--orange`; under 1 minute → `tick` blink in pink/ink.
- **Digit change:** numerals swap instantly (no flip, no fade).

### 6.3 Creator Profile Header (`CreatorBanner`)
- **Visual:** a full-width `.k-block--violet` slab with a 4px ink border, oversized creator name in `.text-hero`, a rotated `VERIFIED` sticker overlapping the top-right corner, and an avatar in a square 3px frame with an offset yellow backing block.
- **Stats row:** follower count, drops shipped, and rating in `.k-panel-flat` cells separated by thick vertical ink rules.

### 6.4 Receipt / Order Ledger (`OrderReceipt`)
- **Style:** a `.k-well`-backed monospace list with dashed ink dividers, like a till receipt taped to the page. Zebra rows alternate `--paper-white` / `--paper-dark`.
- **Header:** ink bar with paper-colored title and a blinking `▮` cursor.
- **Row format:** `ORD-00421 · 2× HEAVY TEE · ₹2,998 · [PAID]` — status stamped `[PAID]` lime, `[PENDING]` orange, `[FAILED]` red.

### 6.5 Toast Notifications (`Toast`)
- **Visual:** a `.k-block` slab slammed into the bottom-right corner with a 6px offset shadow. Role color = message type (lime success, orange warning, red error, cyan info).
- **Motion:** enters via `slam`, exits with an instant cut after 4s. No fade.

### 6.6 Navigation Bar (`TopBar`)
- **Visual:** `--paper-white` bar with a 3px ink bottom border, logo in display type on the left (rotated -2deg), links as uppercase UI text, cart as a `.k-button` with a count sticker. Directly beneath it: the yellow-on-ink `.k-marquee`.
- **Active link:** highlighter underline (`.hl`), never a color change alone.

---

## 7. Layout & Spacing

```css
:root {
  --space-1: 4px;  --space-2: 8px;   --space-3: 12px; --space-4: 16px;
  --space-5: 24px; --space-6: 32px;  --space-7: 48px; --space-8: 64px;
}
```

- **Grid:** 12-column, `gap: var(--space-5)`. Cards may overlap neighbors by up to 12px or rotate ±1deg to break the grid on purpose — but never more than **one** broken element per row.
- **Shadow clearance:** leave at least the shadow's offset in margin on the right and bottom so shadows never clip.
- **Section rhythm:** sections are separated by a 3px ink divider and a mono index (`01 / NEW DROPS`).
- **Max content width:** `1200px`, with edge-to-edge color blocks and marquees allowed to bleed past it.

---

## 8. Accessibility Rules (Loud ≠ Illegible)

- **Contrast:** all role-color fills carry `--ink` text. Every pairing meets WCAG AA (≥ 4.5:1); the lowest is ink on violet at ~7:1.
- **Focus:** 4px cyan outline with 3px offset on every interactive element. Never remove it.
- **State ≠ color alone:** every colored state also carries a text label (`[PAID]`, `SOLD OUT`) or icon.
- **Tap targets:** minimum 44×44px; buttons use 12px/22px padding minimum.
- **Rotation limit:** rotated text never exceeds ±3deg and never applies to paragraphs — only stickers, badges, and headlines.
- **Motion:** respect `prefers-reduced-motion`; marquees and wiggles stop, hover shifts remain static.

---

## 9. Component Usage Checklist

When building new components for Kiln:

- [ ] Use `font-display` (`Bricolage Grotesque`) for headlines, prices, and countdowns — heavy weight, tight leading.
- [ ] Use `font-ui` (`DM Sans`) for body, buttons, and labels; use `font-mono` (`JetBrains Mono`) for IDs, SKUs, receipts, and edition numbers.
- [ ] Set `border-radius: 0` everywhere. **No rounded corners, no exceptions** (including avatars, tags, inputs, and toasts).
- [ ] Give every object a visible `3px solid var(--ink)` border (4px for raised, 2px for small chips).
- [ ] Create depth only with `Npx Npx 0 var(--shadow)` offset shadows — zero blur, ever.
- [ ] Fill with **flat** role colors only; text on any fill is `--ink`.
- [ ] Use at most **one `--pink` hot element per viewport** — it's the loudest voice; don't dilute it.
- [ ] Wrap clickable cards in `.card-hover`; keep transitions ≤ 150ms with `cubic-bezier(0.2, 0, 0, 1)` or `steps()`.
- [ ] Use `.k-well` for every input, search bar, and read-only field.
- [ ] Rotate stickers and badges (±1–3deg); never rotate body copy, inputs, or buttons at rest.
- [ ] Number sections with `.k-index` and separate them with a visible `.k-divider`.
- [ ] Provide a text label alongside every color-coded state.
- [ ] Honor `prefers-reduced-motion`.

### Don'ts
- ✗ No gradients (except the `.hl` highlighter bar and hazard-style patterns).
- ✗ No blurred shadows, glows, glassmorphism, or `backdrop-filter`.
- ✗ No pastel tints or partial-opacity fills.
- ✗ No rounded corners or pill buttons.
- ✗ No fade/ease-in-out transitions longer than 200ms.
- ✗ No more than three saturated role colors visible in a single component.
