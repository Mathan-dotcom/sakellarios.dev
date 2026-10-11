# Frontend UI Data Inventory

**Document Purpose:** Exhaustive inventory of all data displays, telemetry indicators, metrics, and hardcoded values across the frontend (`src/`).  
**Scope:** Covers all components presenting data: `Viewport01Hero`, `Viewport02Thesis`, `Viewport03Treasury`, `Viewport04Escalation`, `Viewport05Ledger`, `CockpitHeader`, `OpticalGovernorCanvas`, `LedgerDisintegrationStrips`, `useAnimatedNumber`, and the Data Loom data sources (`EuthynaDataLoomCanvas` and `useSakellariousEngine`).

---

## 1. Component Data Matrix & Hardcoded Value Citations

### A. CockpitHeader (`src/components/CockpitHeader.tsx`)
Persistent sticky top bar monitoring treasury state.
- **Root State Indicator (`CockpitHeader.tsx:111`):**
  - Displays `"STATE // HALTED AT DATUM"` when `engine.escalations.length > 0`, otherwise `"STATE // CALIBRATED"`.
- **Block Height Ticker (`CockpitHeader.tsx:115`):**
  - Displays `BLK #{blockHeight.toLocaleString()}`. Derived from synthetic hook `useMicroYieldTicker()`.
- **Cell 01: Buffer Metric (`CockpitHeader.tsx:175-179`):**
  - Value: `{animLiquid.toLocaleString()} USDC` (bound to `engine.balances.arcLiquidUsdc`).
  - Hardcoded Label (`CockpitHeader.tsx:178`): `[FLOOR >= 400K]`.
- **Cell 02: Reserve Metric (`CockpitHeader.tsx:222-232`):**
  - Value: `{animUsyc.toLocaleString()} USYC` (bound to `engine.balances.arcUsycVault`).
  - Synthetic Ticker (`CockpitHeader.tsx:232`): `+{liveHarvestYield.toFixed(6)}` (client-side synthetic drift).
- **Cell 03: Escalation Telemetry (`CockpitHeader.tsx:273-278`):**
  - Displays `{engine.escalations.length} HALTED [{pendingAmount.toFixed(2)} USDC]` or `0 NOMINAL`.
- **Cell 04: Ledger Anchor (`CockpitHeader.tsx:320`):**
  - Hardcoded Text: `EUTHYNA #00481 [ARC L1]`.

---

### B. Viewport 01: Hero Chamber (`src/components/Viewport01Hero.tsx`)
Initial entry chamber featuring monumental metrics and datum hairlines.
- **Top Strip Left Datum (`Viewport01Hero.tsx:143`):**
  - Hardcoded: `SYS // 01 — AUTONOMOUS TREASURY GOVERNOR`.
- **Top Strip Right Datum (`Viewport01Hero.tsx:158`):**
  - Hardcoded: `ARC L1 POLICYWALLET // 21 MATHEMATICAL GUARDRAILS`.
- **Horizontal Datum Line Labels (`Viewport01Hero.tsx:206, 219`):**
  - Hardcoded Left: `AXIS Y:00 // DATUM`.
  - Hardcoded Right: `FLOOR // 400,000 USDC`.
- **Hero Monument Subtitle (`Viewport01Hero.tsx:276`):**
  - Hardcoded: `CALIBRATED AUTHORITY // V2.0`.
- **Plinth Column 1 — Value/Custody (`Viewport01Hero.tsx:361, 380, 392`):**
  - Category: `01 // VALUE — CUSTODY`.
  - Metric: `${Math.round(animCustody).toLocaleString()}` (bound to `engine.balances.totalArcCapital`).
  - Asset label: `USDC + USYC RESERVE`.
- **Plinth Column 2 — Bound/Tolerance (`Viewport01Hero.tsx:420, 439, 451`):**
  - Category: `02 // BOUND — TOLERANCE`.
  - Metric: `{Math.round(animFloor / 1000)}K FLOOR` (bound to `engine.forecasting.targetBuffer30D`).
  - Hardcoded Cap Label: `250 USDC SINGLE-TX CAP`.
- **Plinth Column 3 — Proof/Archive (`Viewport01Hero.tsx:479, 498, 510`):**
  - Category: `03 // PROOF — ARCHIVE`.
  - Metric: `EUTHYNA #{String(Math.round(animFolio)).padStart(5, '0')}` (hardcoded roll-up to 481 at line 28).
  - Status label: `ARC L1 VERIFIED`.

---

### C. Viewport 02: Thesis Statement (`src/components/Viewport02Thesis.tsx`)
Editorial typography chamber.
- **Telemetry Marquee Band (`Viewport02Thesis.tsx:103-116`):**
  - Hardcoded Pipeline Tokens:
    - `"FINANCIAL UNCERTAINTY"`
    - `"OPENSANCTIONS SCREEN (0.00)"`
    - `"POLICYWALLET 21 GUARDRAILS"`
    - `"CIRCLE PAYMASTER GASLESS EXECUTION"`
    - `"EUTHYNA BEANCOUNT + JSON-LD PROOF"`
- **Editorial Manifesto Text (`Viewport02Thesis.tsx:14-15`):**
  - Hardcoded: `"POWER IN AUTONOMOUS FINANCE IS NOT WHAT THE MACHINE CAN SPEND — IT IS THE MATHEMATICAL BOUNDARY IT CANNOT CROSS WITHOUT PROOF."`
- **Invariant 01 Card (`Viewport02Thesis.tsx:318-352`):**
  - Title: `01 // THE GOVERNANCE DATUM` / `ZERO UNANCHORED METRICS`.
  - Footer tag: `[ARC L1 PERSISTENT DATUM]`.
- **Invariant 02 Card (`Viewport02Thesis.tsx:379-413`):**
  - Title: `02 // VALUE — BOUND — PROOF` / `MANDATORY TRIADIC PROOF`.
  - Footer tag: `[POLICYWALLET ON-CHAIN ENFORCEMENT]`.
- **Invariant 03 Card (`Viewport02Thesis.tsx:439-473`):**
  - Title: `03 // MATERIAL FIXEDNESS` / `TEMPORAL STATE PHYSICS`.
  - Footer tag: `[EUTHYNA IMMUTABLE ARCHIVE]`.

---

### D. Viewport 03: Treasury & Bounded Operations (`src/components/Viewport03Treasury.tsx`)
Interactive liquidity equilibrium canvas and PolicyWallet simulation bays.
- **Equilibrium Canvas Crosshair Tooltip (`Viewport03Treasury.tsx:160`):**
  - Hardcoded Text: `SWEEP EPOCH #00480 // USYC APY: 5.12%`.
- **Nominal Floor Datum in Canvas (`Viewport03Treasury.tsx:109`):**
  - Hardcoded line 12 represents `400k Floor Datum`.
- **Default Obligation Form Values (`Viewport03Treasury.tsx:43-46`):**
  - Vendor: `'0x4444444444444444444444444444444444444444'`.
  - Amount: `'180'`.
  - Category: `'SAAS'`.
  - Invoice Ref: `'INV-CUSTOM-012'`.
- **Policy Evaluation Bay Titles:**
  - Bay 1: `OPENSANCTIONS PRE-FLIGHT` (`[ENFORCED]`).
  - Bay 2: `POLICYWALLET 250 USDC CAP` (`[ENFORCED]`).
  - Bay 3: `CATEGORY DAILY ALLOCATION` (`[ENFORCED]`).
  - Bay 4: `JIT LIQUIDITY REDEMPTION` (`[ENFORCED]`).

---

### E. Viewport 04: Escalation & Sovereign Seal (`src/components/Viewport04Escalation.tsx`)
Visual deadlock chamber rendering halted transactions.
- **Trajectory Header & Nonce (`Viewport04Escalation.tsx:390-394`):**
  - Label: `TRAJECTORY VECTOR // DESCENDING`.
  - Nonce: `NONCE #{activeEscalation ? activeEscalation.escalationNonce : 1}`.
- **Governance Datum Line (`Viewport04Escalation.tsx:431, 476`):**
  - Left Badge: `250.00 USDC GOVERNANCE DATUM`.
  - Right Badge: `COLLISION DEADLOCK // 100% ENERGY ABSORBED` (or `VECTOR CLEARED // RELEASED TO EUTHYNA`).
- **Hidden Telemetry Backdrop Layer (`Viewport04Escalation.tsx:576-578`):**
  - Hardcoded:
    - `ARC L1 // POL-02 CAP EXCEEDED: 500.00 USDC`
    - `EXCEPTION ID: 0x9A48F7 // STATUS: DEADLOCK`
    - `TIMELOCK: 72H // MULTISIG SOVEREIGN SEAL`
- **Sovereign Seal Button Duration (`Viewport04Escalation.tsx:115`):**
  - Hardcoded Press-and-Hold Duration: `1200ms` (1.2 seconds).

---

### F. Viewport 05: Ledger & Data Loom (`src/components/Viewport05Ledger.tsx` & `EuthynaDataLoomCanvas.tsx`)
Archival register of double-entry slabs.
- **Default Expanded Drawer (`Viewport05Ledger.tsx:13`):**
  - Hardcoded default folio: `'EUTHYNA #00481'`.
- **Data Loom Top Architectural HUD Strip (`EuthynaDataLoomCanvas.tsx:752-765`):**
  - Hardcoded: `■ CONTINUOUS CONVEYOR STREAM // HORIZONTAL SPATIAL RUNWAY // 18 IMMUTABLE REGISTER SLABS`.
  - Dynamic Telemetry: `VELOCITY COUPLING: {hudVelocity.toFixed(2)} M/S // CULLING: 60 FPS GPU`.
- **Default 18 Ledger Slabs (`EuthynaDataLoomCanvas.tsx:233-252`):**
  18 hardcoded slab records used when live invoices are fewer than 18:
  - `EUTHYNA #00481`: INFRASTRUCTURE, 120.00 USDC, `0x333...`, `0xb0812702...`
  - `EUTHYNA #00480`: YIELD_SWEEP, 85,000.00 USDC, `0x111...`, `0x7e8c182a...`
  - `EUTHYNA #00479`: PAYROLL, 14,250.00 USDC, `0x444...`, `0x91d84b22...`
  - `EUTHYNA #00478`: LIQUIDITY_BUFFER, 45,000.00 USDC, `0x222...`, `0x3a48e71c...`
  - `EUTHYNA #00477`: YIELD_SWEEP, 32,000.00 USDC, `0x111...`, `0x5c721980...`
  - `EUTHYNA #00476`: SECURITY_AUDIT, 18,500.00 USDC, `0x555...`, `0x88f12a39...`
  - `EUTHYNA #00475`: ORACLE_SUBSCRIPTION, 850.00 USDC, `0x666...`, `0x2b4c6e80...`
  - `EUTHYNA #00474`: YIELD_SWEEP, 62,400.00 USDC, `0x111...`, `0xef1092a8...`
  - `EUTHYNA #00473`: COMPLIANCE_ATTESTATION, 5,600.00 USDC, `0x777...`, `0x4388e21a...`
  - `EUTHYNA #00472`: GASLESS_RELAY_FEE, 240.00 USDC, `0x888...`, `0x6a190b34...`
  - `EUTHYNA #00471`: YIELD_SWEEP, 91,500.00 USDC, `0x111...`, `0x19f8e439...`
  - `EUTHYNA #00470`: TREASURY_REBALANCE, 110,000.00 USDC, `0x999...`, `0x77d01c92...`
  - `EUTHYNA #00469`: NODE_STAKING_REWARD, 3,750.00 USDC, `0xaaa...`, `0x88e1a902...`
  - `EUTHYNA #00468`: YIELD_SWEEP, 48,900.00 USDC, `0x111...`, `0x00a891f7...`
  - `EUTHYNA #00467`: SMART_CONTRACT_ESCROW, 27,500.00 USDC, `0xbbb...`, `0x9812bc88...`
  - `EUTHYNA #00466`: INSURANCE_PREMIUM, 4,200.00 USDC, `0xccc...`, `0x33445566...`
  - `EUTHYNA #00465`: YIELD_SWEEP, 77,200.00 USDC, `0x111...`, `0x55667788...`
  - `EUTHYNA #00464`: TAX_WITHHOLDING, 16,800.00 USDC, `0xddd...`, `0x778899aa...`

---

### G. 3D Artifacts & Specialized Effects
1. **OpticalGovernorCanvas (`src/components/OpticalGovernorCanvas.tsx`):**
   - Backdrop Shader Colors (`OpticalGovernorCanvas.tsx:70-71`):
     - Amber: `vec3(0.831, 0.580, 0.227)` (`#D4943A`)
     - Tension: `vec3(0.784, 0.294, 0.192)` (`#C84B31`)
   - Particle Core (`OpticalGovernorCanvas.tsx:99`):
     - 4,600+ procedural stippled point-cloud vertices in a spherical/toroidal matrix.
2. **LedgerDisintegrationStrips (`src/components/LedgerDisintegrationStrips.tsx`):**
   - Texture Generator (`LedgerDisintegrationStrips.tsx:66-70`):
     - Canvas size: 2048 x 700 px, transparent background.
     - 24 ruled hairline intervals (spacing 35px), 120 procedural barcode columns.
3. **useAnimatedNumber (`src/core/useAnimatedNumber.ts`):**
   - Default Duration (`useAnimatedNumber.ts:12`): `420ms`.
   - Mechanical Quartic Out Easing: `1 - Math.pow(1 - progress, 4)`.
   - Hex Scramble Duration (`useAnimatedNumber.ts:86`): `250ms`, cycling through `'0123456789ABCDEF'`.
4. **Deterministic Fallback Model (`src/core/useSakellariousEngine.ts:113-252`):**
   - Balances: `totalArcCapital = 1,420,000.00`, `arcLiquidUsdc = 420,000.00`, `arcUsycVault = 1,000,000.00`.
   - Forecasting: `targetBuffer30D = 400,000.00`, `burnRate30D = 18,000.00`, `runwayDays = 700.0`.
   - Policy: `dailyLimit = 1,000.00`, `spentToday = 120.00`, `maxSingleTx = 250.00`.
   - Initial Escalation: `500.00 USDC` halted for `INV-PARTNER-009`.
   - MicroTicker Initial: `liveHarvestYield = 12.851940`, `blockHeight = 4,892,111`.
