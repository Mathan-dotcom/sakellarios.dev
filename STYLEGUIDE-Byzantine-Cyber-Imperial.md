# 🏛️ Byzantine Cyber-Imperial Design System (v2.0.0)
## Design Specification for sakellarious.dev (Circle Arc L1)

> **"Where Sovereign Byzantine Imperial Treasury Authority Meets Cutting-Edge Arc L1 Autonomous Finance."**

---

## 1. Design Philosophy & Aesthetic Intent

The **Byzantine Cyber-Imperial** design system moves completely beyond generic flat neo-brutalism and cartoon poster styling. It fuses the ancient institutional authority of the Byzantine Empire (*Sakellarios & Vestiarion*—imperial treasury custody, payroll, and currency minting) and classical Athenian governance (*Euthyna*—continuous magistrate audits) with the high-speed cryptographic precision of Circle's stablecoin-native Layer-1 (**Arc**).

### Core Pillars
1. **Sovereign Monolithic Depth:** Deep void obsidian backing (`#07090E` / `#0C1018`) with glowing gold chamfered borders, corner brackets (`⌞ ⌟ ⌜ ⌝`), and crisp metallic frames.
2. **Imperial Byzantine Gold:** Radiant, burnished gold accents (`#E5B443` / `#FFE28A`) representing sovereign treasury authority.
3. **Tyrian Imperial Purple & Arc Electric Cyan:** Regal violet glows (`#7928CA`) paired with high-frequency Arc L1 data telemetry (`#00E5FF`).
4. **Deterministic Mathematical Guardrails:** No probabilistic guesswork — direct visual reflection of on-chain `PolicyWallet.sol` daily ceilings ($1,000/day) and single transaction caps ($250).
5. **Multi-Sensory Feedback:** Integrated Web Audio API imperial synthesizer providing tactile settlement chimes, multi-sig escalation bells, and sanctions alert cues.

---

## 2. Color Palette & Substrates

```css
:root, [data-theme="byzantine"] {
  /* Substrates & Depth */
  --bg-obsidian:       #07090e;  /* Deep void abyss */
  --bg-surface:        #0c1018;  /* Recessed command foundation */
  --bg-card:           rgba(15, 20, 31, 0.88);  /* Monolithic glass plate */
  --bg-card-hover:     rgba(22, 30, 48, 0.94);
  --bg-well:           #090d14;  /* Inset terminal wells */

  /* Imperial Sovereign Accents */
  --gold-primary:      #e5b443;  /* Byzantine Imperial Gold */
  --gold-light:        #ffe28a;  /* Illuminated Leaf Gold */
  --gold-dark:         #9a7426;  /* Burnished Solid Coin Gold */
  --gold-glow:         rgba(229, 180, 67, 0.24);
  --gold-border:       rgba(229, 180, 67, 0.32);
  --gold-border-solid: #c99a32;

  /* Imperial Role Accents */
  --tyrian-purple:     #7928ca;  /* Byzantine Tyrian Imperial Violet */
  --tyrian-glow:       rgba(121, 40, 202, 0.28);
  --arc-cyan:          #00e5ff;  /* Circle Arc L1 Electric Cyan */
  --arc-glow:          rgba(0, 229, 255, 0.28);
  --emerald-pass:      #05ffa1;  /* Athenian Euthyna Verified Audit */
  --emerald-glow:      rgba(5, 255, 161, 0.24);
  --crimson-revert:    #ff2e55;  /* OFAC SDN Sanctions Revert */
  --crimson-glow:      rgba(255, 46, 85, 0.28);
  --amber-warn:        #ffb020;  /* Escalation Threshold Multi-Sig */

  /* Text & Inks */
  --text-primary:      #f8fafc;
  --text-secondary:    #94a3b8;
  --text-muted:        #64748b;
  --text-gold:         #e5b443;
}
```

---

## 3. Typography Hierarchy

| Role | Typeface | Weights | Usage |
| :--- | :--- | :--- | :--- |
| **Imperial Monumental Serif** | `Cinzel` | 600, 700, 800, 900 | Majestic brand crest, section titles, monumental KPIs |
| **High-Fintech Interface UI** | `DM Sans` | 300, 400, 500, 600, 700 | Narrative descriptions, command buttons, interactive cards |
| **Cryptographic Telemetry** | `JetBrains Mono` | 400, 500, 600, 700 | Hash strings, gas metrics, Beancount journals, status pills |

---

## 4. Signature Components

### 4.1 Imperial Status Marquee
- Ultra-high contrast rolling banner streaming real-time network telemetry.
- Separated by golden diamond glints (`◆`).

### 4.2 War Room Command Plate
- Features chamfered corner accents and 1.5px gold borders.
- Houses the **PolicyWallet Guardrail Gate**: a 10-segment crystal indicator tracking the 1,000 USDC daily spending limit ($120 spent, $880 remaining) and single transaction auto-settlement ceiling ($\le \$250$).

### 4.3 2D Holographic Circuit Blueprint (`flowCanvas`)
- Screen-printed circuit traces on dark obsidian.
- 7 interconnected nodes with radiant cyan particle pulses animating packet flow between RPC, Agent, OpenSanctions, PolicyWallet, Paymaster, USYC Vault, and Euthyna Ledger.

### 4.4 Euthyna Immutable Audit Run-Sheet
- Monospace double-entry ledger stream recording Beancount journals, cryptographic hashes, and execution status stamps (`[PAID]`, `[ESCALATED]`, `[REVERTED]`, `[SWEEP]`).

### 4.5 Web Audio API Tactile Haptics
- **Payment Settled:** D5 &rarr; A5 imperial triangle chime.
- **Escalation Triggered:** Multi-sig sine bell.
- **Sanctions Reverted:** Low-frequency sawtooth alert buzz.
- **USYC Swept:** Frequency ascent rebalance harmonic.

### 4.6 Curso-Dynamic Spotlight & Reticle Aurora
- **Movement & Scroll Fade-In:** As the user moves the cursor or scrolls via mouse wheel/touch, a 520px ethereal Byzantine aura (`#cursorAurora`) smoothly **fades in** (`opacity: 1`, scale 1.0 &rarr; 1.2 during scroll pulses) with illuminated gold, tyrian violet, and electric cyan gradients.
- **Idle Fade-Out:** When scrolling stops and the cursor rests for >1.2s, the aurora and precision crosshair reticle gracefully **fade out** (`opacity: 0`, scale 0.65).
- **Surface Proximity Glow:** Hovered monolithic cards compute relative mouse coordinates (`--mouse-x`, `--mouse-y`) to cast a localized, soft gold radial highlight that follows cursor trajectory.

### 4.7 Scroll-Driven Entry & Exit Fade Architecture
- **Modern CSS View Timeline:** Utilizes `@supports ((animation-timeline: view()) and (animation-range: entry))` with `@keyframes imperialScrollEntry` and `@keyframes imperialScrollExit` for hardware-accelerated compositor-driven fades.
- **Progressive Fallback:** Universal `IntersectionObserver` detects element scroll position, applying `.in-view` (fade in to 100%) and `.out-view-top` (soft fade out to 18%) to sustain focus on the active focal reading zone.
- **Boundary Vignettes:** Top and bottom 52px gradient masks (`.viewport-fade-top`, `.viewport-fade-bottom`) seamlessly dissolve content as it enters from the bottom and exits into the obsidian void above.
- **Scroll Rail Meter:** A golden 3px vertical track (`#scrollRail`) that dynamically fades in while scrolling and fades out on idle.

