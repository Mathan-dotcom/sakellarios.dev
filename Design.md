# DESIGN.md — SAKELLARIOUS.DEV
**Visual Identity & Kinetic Architecture Specification (v2.0 — Authoritative)**  
**Target Platform:** Web Desktop (Primary: 1440x900 / 1920x1080) & Responsive Viewports  
**Tech Stack Alignment:** Vite, TypeScript, Three.js (WebGL), GSAP (ScrollTrigger), Lenis, Tailwind CSS / Vanilla CSS Variables  
**Status:** Canonical / Locked — Supersedes all legacy Kiln Neo-Brutalism PRD specifications.

---

## 1. Executive Thesis & Aesthetic Territory

**Sakellarious** (`sakellarious.dev`) is an autonomous corporate treasury governor built on Arc. It continuously observes liquidity, forecasts cash-flow obligations, sweeps surplus `USDC` into yield-bearing `USYC` via Circle Gateway, screens counterparties via OpenSanctions, enforces on-chain `PolicyWallet` spend limits, halts over-limit exceptions for human owner approval, and permanently records all consequential transactions into an immutable `Euthyna` ledger (`Beancount` + `JSON-LD` + Arc settlement hashes).

### 1.1 The Territory: Calibrated Authority
Sakellarious does not adopt generic Web3 neon gradients, speculative DeFi aesthetics, or sanitized SaaS dashboard cards. The aesthetic is **Calibrated Authority**: a synthesis of **metrological precision instrumentation** with **cinematic spatial depth, deterministic physics, and three-dimensional architectural machinery**.

Constraint is the primary source of beauty and visual tension. Every surface, transition, and micro-interaction communicates the core product lifecycle:

$$\text{FINANCIAL UNCERTAINTY} \longrightarrow \text{GOVERNED DECISION} \longrightarrow \text{EXECUTION} \longrightarrow \text{VERIFIABLE FACT}$$

### 1.2 The Three Structural Invariants
1. **The Governance Datum:** Financial values never float unanchored in generic cards. Every consequential quantity is positioned relative to a visible, persistent structural boundary—the **Governance Datum**. Values approach, clear, or physically halt against this line.
2. **The Value–Bound–Proof Triad:** No metric is displayed as an isolated number. Consequential metrics simultaneously expose:
   * **VALUE:** The active or proposed numerical quantity.
   * **BOUND:** The explicit policy threshold or operating floor constraining it.
   * **PROOF:** The cryptographic transaction hash, OpenSanctions score, or ledger receipt verifying it.
3. **Material Fixedness (Temporal State Physics):** Materiality directly encodes reversibility:
   * **PROJECTED (Future):** Low-opacity hairline geometry, unfixed coordinates, oscillating uncertainty bands.
   * **CONTACT (Present):** High-contrast structural tension, active WebGL response, localized signal illumination at the Governance Datum.
   * **REGISTERED (Past):** Flat, zero-motion, high-density archival stone (`Euthyna` ledger entries).

---

## 2. Color System & Bimodal Chamber Architecture

Sakellarious uses a **Bimodal Chamber Architecture**. Darkness is not an aesthetic toggle; it is an architectural depth reserved for 3D simulation, ceremony, and exception handling.

```css
:root {
  /* ==========================================================================
     CHAMBER I: OBSIDIAN VOID (Hero 3D Chamber, Escalation Well, Recessed Wells)
     ========================================================================== */
  --void-bg: #0A0A09;
  --void-surface: #121210;
  --void-text-primary: #F2EFE9;
  --void-text-muted: rgba(242, 239, 233, 0.42);
  --void-hairline: rgba(242, 239, 233, 0.13);
  --void-datum-line: rgba(242, 239, 233, 0.75);

  /* ==========================================================================
     CHAMBER II: MINERAL ARCHIVE (Live Treasury Matrix, Policy Engine, Ledger)
     ========================================================================== */
  --mineral-bg: #F2EFE9;
  --mineral-recess: #E7E2D8;
  --mineral-ink: #141413;
  --mineral-ink-muted: rgba(20, 20, 19, 0.44);
  --mineral-hairline: rgba(20, 20, 19, 0.14);
  --mineral-datum-line: #141413;

  /* ==========================================================================
     SEMANTIC SIGNAL SPECTRUM (State-Earned Only — Strictly Non-Decorative)
     ========================================================================== */
  --signal-tension: #C84B31;     /* Burnt International Orange: Boundary Collision & Override */
  --signal-amber: #D4943A;       /* Calibrated Amber: 3D Radial Core & Active USDC Sweep */
  --signal-verified: #2E5A44;    /* Archival Oxide Green: Cryptographic Lock & Proof */
  --signal-breach: #9E2A2B;      /* Deep Crimson: Sanctions Failure or Rule Invalidation */

  /* ==========================================================================
     STRUCTURAL & KINETIC CONSTANTS
     ========================================================================== */
  --radius-global: 0px;          /* STRICT ZERO RADIUS across all containers and buttons */
  --border-width: 1px;
  --ease-mechanical: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-damped-settle: cubic-bezier(0.22, 1, 0.36, 1);
}