# AGENTS.md — SAKELLARIOUS ARCHITECTURE & UI GOVERNANCE

## 1. CANONICAL DESIGN AUTHORITY
`DESIGN.md` in the project root is the single authoritative specification for all frontend layout, color polarity, typography, 3D WebGL artifacts, cursor physics, and scroll choreography.
- **DEPRECATED SPECIFICATIONS:** Any mention of "Kiln", "Neo-Brutalism", paper textures, thick black borders, or offset hard shadows in `PRD.md` or other docs is **VOID AND FORBIDDEN**.

## 2. STRICT UI / LOGIC BOUNDARY
- **Quarantined Legacy UI (`_quarantined_legacy_ui/`):** Contains deprecated visual components and stylesheets. Never import, read, or copy layout patterns from `_quarantined_legacy_ui/`.
- **Headless Engine (`src/core/useSakellariousEngine.ts`):** All UI viewports must consume data and trigger actions exclusively through this headless hook/adapter, which wraps the existing backend routes, smart contract ABIs, OpenSanctions calls, Circle Gateway/Paymaster logic, and Euthyna/Beancount generators.

## 3. MANDATORY VISUAL & TECHNICAL LAWS
- **Stack:** `three` + `@types/three`, `gsap` (`ScrollTrigger`), `lenis`.
- **Fonts:** `Syne` (700), `Plus Jakarta Sans` (400, 500), `JetBrains Mono` (400, 500).
- **Zero-Radius Law:** `border-radius: 0px` everywhere. No rounded cards, pills, or buttons.
- **Zero-Shadow Law:** No `box-shadow`, glow filters, or frosted glass blur.
- **No Decorative Icons:** Never import `lucide-react`, `heroicons`, or `fontawesome` into the new UI. Use strictly typographic telemetry marks (`//`, `->`, `[ ]`, `■`, `+`).