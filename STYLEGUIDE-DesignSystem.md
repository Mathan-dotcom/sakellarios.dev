# Vestiarion AI — Imperial Arc Neo-Brutalism Design System
**Version:** 6.0.0  
**Specification Document:** Autonomous Continuous Treasury & Business Operator (Arc L1)  
**Target Environments:** Web / Desktop Command Center  
**Design Paradigm:** Imperial Byzantine Neo-Brutalism × Arc L1 Sovereign Vault Architecture  

---

## 1. Executive Vision & Design Philosophy

Vestiarion AI is an autonomous, on-chain business operator and treasury engine built natively for **Arc L1**. The user interface rejects generic Web3 and crypto-dashboard clichés (frosted glass, rounded pastel cards, amorphous gradients, generic light-grey concrete).

Instead, it embodies **Imperial Arc Neo-Brutalism**:
- **Monolithic Structural Discipline:** Zero border-radius across all elements (`* { border-radius: 0 !important; }`), bold structural borders (2.5px), and solid offset displacement drop shadows (zero blur).
- **Institutional Sovereign Vault Aesthetic:** A high-contrast Obsidian Vault foundation paired with high-voltage Byzantine Violet, continuous Yield Mint, and Bullion Amber.
- **Physical Hardware Metaphor:** Machine-cut corner rivets/screws, hazard diagonal stripes, rubber stamp certification marks, and physical knife-switch controls.
- **Continuous Living Telemetry:** Real-time fractional micro-yield accrual tickers, dynamic runway simulators, animated capital flow circuit schematics, and zero-latency Web Audio feedback.

---

## 2. Color Palette & Dual Theme Engine

The system supports a persistent, dual-theme engine toggled via physical control and stored in `localStorage`:
1. **Imperial Obsidian Vault (`data-theme="steel"`) [Default]:** High-voltage cyber-sovereign dark mode.
2. **Imperial Technical Parchment (`data-theme="meridian"`):** Warm, high-contrast technical paper mode.

### 2.1 Color Tokens Specification

| Token Name | Obsidian Vault (`steel`) | Technical Parchment (`meridian`) | Semantic Purpose |
| :--- | :--- | :--- | :--- |
| `--bg-page` | `#08090e` | `#f5f2eb` | Base canvas substrate |
| `--bg-card` | `#11131c` | `#ffffff` | Primary bento slab containers |
| `--bg-well` | `#181b28` | `#eae5d8` | Recessed wells, tables & input fields |
| `--bg-subtle` | `#212538` | `#ded8c8` | Secondary scored frames & borders |
| `--border-color` | `#2b3047` | `#07080b` | High-impact brutalist outlines (2.5px) |
| `--border-bright`| `#3f476a` | `#333647` | Hover states & panel highlights |
| `--ink` | `#f8f9fd` | `#07080b` | Primary monumental headers & numbers |
| `--ink-secondary`| `#9da3be` | `#484b5c` | Descriptive technical labels & telemetry |
| `--ink-faint` | `#626782` | `#8a8e9e` | Metadata, captions & timestamps |
| `--arc-purple` | `#8b5cf6` | `#6320ee` | **Arc L1 & Byzantine Authority (Primary Accent)** |
| `--yield-green` | `#00f59b` | `#00994d` | **USYC Compounding Yield & Solvency (Mint)** |
| `--gold-amber` | `#ffb703` | `#d97706` | **Treasury Gold Bullion & Supervisor Escalations** |
| `--cyan-blue` | `#00d2ff` | `#0284c7` | **Circle Gateway Multichain Routes & Bridges** |
| `--signal-red` | `#ff3366` | `#dc2626` | **OpenSanctions Violations & Policy Reverts** |
| `--acid-lime` | `#d4ff00` | `#b6e600` | **High-Voltage Action Highlights** |

### 2.2 Shadow Offset Tokens
All shadows use pure directional translation without Gaussian blur:
```css
--shadow-sm: 3px 3px 0 #000000;
--shadow-md: 6px 6px 0 #000000;
--shadow-lg: 10px 10px 0 #000000;
--shadow-purple: 6px 6px 0 rgba(139, 92, 246, 0.4);
--shadow-green: 6px 6px 0 rgba(0, 245, 155, 0.35);
```

---

## 3. Typography Hierarchy

The typography pairs an industrial headline typeface with a geometric grotesque UI typeface and a high-precision monospace data face.

```
Headlines:    'Archivo Black', -apple-system, sans-serif
Body & UI:    'Space Grotesk', -apple-system, sans-serif
Telemetry:    'IBM Plex Mono', Courier, monospace
```

### 3.1 Type Classes

| Class | Font Family | Size | Weight / Line-Height | Tracking / Transform | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `.text-display-hero` | Archivo Black | `clamp(2.4rem, 5.5vw, 4.2rem)` | 900 / `0.98` | `-0.03em` / UPPERCASE | Main hero title |
| `.text-display-lg` | Archivo Black | `clamp(1.8rem, 3.8vw, 2.8rem)` | 900 / `1.02` | `-0.025em` / UPPERCASE | Section monumental titles |
| `.text-display-md` | Archivo Black | `clamp(1.3rem, 2.4vw, 1.85rem)` | 900 / `1.1` | `-0.02em` / UPPERCASE | Bento card headers |
| `.text-heading` | Space Grotesk | `1.05rem` | 700 / `1.25` | `+0.04em` / UPPERCASE | Card subheads, table headers |
| `.text-body` | Space Grotesk | `0.925rem` | 400 / `1.55` | Normal | Narrative explanations |
| `.text-data` | IBM Plex Mono | `0.85rem` | 600 / `1.4` | Tabular Nums | Financial balances & addresses |
| `.text-micro` | IBM Plex Mono | `0.70rem` | 700 / `1.3` | `+0.08em` / UPPERCASE | Category tags, node indicators |

---

## 4. Surfaces, Geometry & Structural Details

### 4.1 Zero-Radius Rule
```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  border-radius: 0 !important;
}
```

### 4.2 Industrial Hardware Fasteners (`.bru-screw`)
Simulates physical chassis enclosure bolts at slab perimeters:
```html
<div class="vault-master-card">
  <div class="bru-screw bru-screw--tl"></div>
  <div class="bru-screw bru-screw--tr"></div>
  <div class="bru-screw bru-screw--bl"></div>
  <div class="bru-screw bru-screw--br"></div>
  <!-- Card Content -->
</div>
```

### 4.3 Rubber Stamp Certification Badges (`.bru-stamp`)
Tactile rubber stamps that evoke certified bureaucratic authority:
- `.bru-stamp--purple`: `[ARC TESTNET // LOCKED v6.0]`
- `.bru-stamp--success`: `[+5.12% USYC COMPOUNDING]`
- `.bru-stamp--warning`: `[CAP OVERRIDE ARMED]`
- `.bru-stamp--critical`: `[SDN LISTED // VIOLATION DETECTED]`
- `.bru-stamp--cyan`: `[OCR / API INGEST]`

---

## 5. Master Bento Layout & Component Architecture

### 5.1 System Masthead HUD
Sticky master control console (`top: 0`, `z-index: 1000`):
- **Live Status Beacons:** Arc L1, Circle Gateway, Circle Paymaster, PolicyWallet.
- **Continuous Yield Accrual Pill:** Dynamic display calculating `$0.04058/sec` micro-yield.
- **Today's Harvest Real-Time Counter:** Fractional cent counter (`$12.8767 USDC`) incrementing every 400ms.
- **Arc L1 Block Height Counter:** Incrementing on block arrival (`#4,892,401`).
- **Tactile Switches:** Theme Switcher, Chaos Engine Toggle, Web Audio Mute.

### 5.2 Hero Bento Deck
An asymmetric 12-column grid (`7 cols` + `5 cols`):
1. **Left (Span 7) — The Sovereign Treasury Vault:**
   - Monumental total balance readout (`$34,880.00`).
   - Dual-tone Treasury Distribution Bar:
     - 28.3% Liquid Operating (`#00f59b` Yield Mint)
     - 71.7% USYC Vault (`#8b5cf6` Byzantine Purple)
   - 4-Stat Data Matrix: Liquid, USYC, 30-Day Buffer, Runway Days.
   - 1-Click Action Buttons: `[⚡ AUTONOMOUS YIELD SWEEP]` and `[💧 JIT EMERGENCY REDEEM ($500)]`.
2. **Right (Span 5) — PolicyWallet.sol Guardrails HUD:**
   - Daily spending limit progress bar (`$120.00 / $1,000.00`).
   - Global remaining allowance (`$880.00`) and single transaction cap (`$250.00`).
   - Category-independent daily budget meters:
     - Infrastructure (`$120 / $500`)
     - Payroll (`$0 / $800`)
     - SaaS (`$0 / $300`)
     - Vendor (`$0 / $400`)

---

## 6. Flagship Interactive Features

### 6.1 Interactive Capital Flow Pipeline Schematic
An animated circuit architecture demonstrating Vestiarion's automated loop:
```
[STAGE 01: Inbound Bill]
       │
       ▼
[STAGE 02: OpenSanctions Radar] ──(Sanctioned)──> [⛔ Hard Revert]
       │
       ▼
[STAGE 03: PolicyWallet Caps]
       ├── (<= $250 USDC) ──> [STAGE 04A: Circle Paymaster] ──> [⚡ Settled Gasless ($0.00)]
       └── (> $250 USDC)  ──> [STAGE 04B: Escalation Queue] ──> [🛡️ 3-Day Timelock Queue]
       │
       ▼
[Surplus Sweep Loop] ──> [USYC Compounding Vault @ ~5.12% APY] ⇄ [JIT Liquidity Return]
```
- **Traveling Pulse Waves:** SVG dashed circuit traces animated via CSS `@keyframes flowParticle`.
- **Node Inspector:** Clicking any stage (`Stage 01` to `Stage 04`) updates the node inspector with real-time smart contract hooks and invariants.

### 6.2 "What-If" Cash Flow Runway & Yield Simulator
A real-time financial simulation engine:
- **Interactive Sliders:**
  1. Estimated Daily Expense Burn (`$50` to `$1,500` / day).
  2. USYC Vault Allocation (`10%` to `95%` of treasury).
- **Dynamic Computed Metrics:**
  - Projected 30-Day USYC Yield: `(TotalCapital * Alloc * 0.0512) / 12`
  - Operating Runway Days: `(LiquidCapital) / (NetDailyBurn)`
  - Net Daily Burn: `DailyExpense - DailyUSYCYield`
  - Live Health Badge: Updates from `SUFFICIENT BUFFER` (green) $\to$ `MODERATE BURN` (amber) $\to$ `DEFICIT WARNING` (red).

### 6.3 Autonomous Invoice Processing Workbench
- **Scenario Preset Chips:** One-click loading of realistic bills:
  - `[CLOUD INFRA] $120` (Gasless Paymaster approval)
  - `[STIPEND] $400` (Escalated to supervisor queue $> \$250$)
  - `[AI SAAS] $280` (SaaS category check)
  - `[ROGUE SINK] $50` (Smart contract whitelist test)
  - `[SANCTIONED] $75` (Instant OpenSanctions block)
- **4-Stage Visual Stepper:** Real-time progression showing `[PASSED]` in mint green or `[FAILED]` in signal red:
  - `01 // SCREEN` (OpenSanctions)
  - `02 // BUFFER` (30-Day Cash Flow Forecast)
  - `03 // POLICY` (PolicyWallet.sol Caps)
  - `04 // SETTLE` (Circle Paymaster / Escalation)
- **Neural Agent Execution Terminal:** Monospace streaming terminal with timestamped execution steps and transaction hash generation.

### 6.4 Human Supervisor Escalation Queue
Physical index cards for transactions requiring supervisor approval:
- **Displays:** Nonce `#1`, invoice reference, category, exact amount in USDC (`$400.00`), truncated recipient address, queue timestamp, and 3-day timelock guarantee.
- **Actions:**
  - `[✓] APPROVE & EXECUTE ON-CHAIN` (Calls `/api/escalations/:id/approve`)
  - `[✕] REJECT & CANCEL` (Calls `/api/escalations/:id/cancel`)

### 6.5 Euthyna Continuous Audit Ledger & Multichain Reserves
- **Tabbed Dual-Mode:**
  - *Beancount Plaintext Journal:* Formatted double-entry debits/credits.
  - *Circle Gateway Multichain Table:* Real-time balances and `0.00 ms (JIT)` latency across Arc L1, Ethereum Mainnet, Base, and Arbitrum One.

---

## 7. Procedural Web Audio Engine (`BrutalAudio`)

The interface includes a zero-latency Web Audio API procedural synthesizer:
1. **Mechanical Relay Click (`click`):** Square-wave transient with micro-pitch randomization (750Hz–900Hz).
2. **Industrial Pneumatic Stamp Thud (`stampThud`):** Dual-layer sub-bass impact (160Hz $\to$ 24Hz) with an 1100Hz metallic snap.
3. **Emergency Klaxon (`alarm`):** Dual-tone dissonant alert (580Hz + 595Hz) on policy rejections or sanctions hits.
4. **Telemetry Packet Chirp (`dataChirp`):** High-frequency FM packet chirp (1400Hz–2200Hz).
5. **Knife-Switch Clunk (`powerToggle`):** Low-frequency sawtooth clunk on theme and chaos toggles.

---

## 8. Directory & Asset Structure

```
public/
├── css/
│   ├── styleguide.css    # Core design tokens, CSS variables, typography & animations
│   ├── components.css    # Bento grid, flow schematic, sliders, workbench & cards
│   └── responsive.css    # Breakpoint adaptations for tablet and mobile viewports
├── js/
│   ├── sound-effects.js       # Procedural Web Audio synthesizer (BrutalAudio)
│   ├── treasury-dashboard.js  # Live telemetry, micro-yield ticker & What-If simulator
│   ├── yield-manager.js       # USYC surplus sweeps and JIT redemptions
│   ├── invoice-workbench.js   # 4-stage invoice processing pipeline & terminal logs
│   ├── escalation-queue.js    # Supervisor index cards & on-chain approval actions
│   ├── audit-ledger.js        # Euthyna Beancount journal & Merkle receipts
│   └── app.js                 # Bootstrapper, theme switcher, and flow inspector
└── index.html                 # Master Bento Command Deck
```

---

## 9. Key Invariants & Design Rules

1. **No Border-Radius:** Never apply `border-radius` to any element or child component.
2. **Displacement Shadows:** Never use blurred drop shadows (`box-shadow: 0 4px 10px rgba(...)` is forbidden). Always use solid integer displacement (`box-shadow: 6px 6px 0 #000`).
3. **No Decorative Placeholders:** All data fields must display live or simulated realistic numbers, addresses, and transaction hashes.
4. **Tactile Response:** Interactive actions must provide visual hover state shifts (`transform: translate(-2px, -2px)`), active state presses (`transform: translate(2px, 2px)`), and audio feedback.
5. **Accessible High Contrast:** Text contrast ratios must exceed WCAG AAA standards for critical telemetry and interactive buttons.
