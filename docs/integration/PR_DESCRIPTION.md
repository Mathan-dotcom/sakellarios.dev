# Pull Request: Frontend Architecture Integration & Legacy UI Deprecation

## Summary
Integrates the production React + TypeScript + Three.js continuous treasury dashboard (`src/`) into `integration/backend-wiring`, establishes strict backend-frontend segregation guardrails, and removes legacy prototype UI static assets for backend owner review.

## 1. What This PR Adds
- **Production Frontend (`src/`):** Viewport viewports 01–05, Three.js Optical Governor & Euthyna Data Loom Canvas, Caliper Cursor, telemetry adapters (`src/api/adapters.ts`), and type-safe client store (`src/api/client.ts`).
- **Integration Tooling (`tools/`):** Segregation guard (`frontend-guard.mjs`), isolated API unit test runner (`run-api-tests.mjs` with 14/14 tests passing), standalone mock backend (`mock-api.mjs`), and fixture schemas (`tools/fixtures/`).
- **Comprehensive Documentation (`docs/integration/`):** Full architectural API contracts, audit trail manifests, and security observations.

## 2. What This PR Removes
- **16 Approved UI Files:** The 12 Express-served files under `public/` plus 4 legacy prototype root files (`frontend.html`, `landing.html`, `supernova_app.html`, `supernova_explotion_2.html`).
- **508 Experimental Prototype Assets:** Legacy 3D prototype files under `Public/`.
- **Route Impact:** `GET /`, `GET /frontend`, `GET /codex`, `GET /landing`, and `GET /supernova` in `server.js` now return **HTTP 404** (the Node server does not crash; API endpoints remain 100% unaffected). See [BACKEND_CHANGE_REQUESTS.md](file:///c:/Users/steph/Desktop/Git/Secullarius/docs/integration/BACKEND_CHANGE_REQUESTS.md).

## 3. Shared File Modifications
- **`package.json` & `package-lock.json`:** Additive frontend dependencies only (`react`, `three`, `gsap`, etc.). `dev` and `start` are unchanged (both run `node server.js`); UI scripts are `dev:ui`, `build:ui`, `preview:ui`. Backend dependencies (`express`, `ethers`, `cors`, `dotenv`, `@openzeppelin/contracts`), runtime metadata (`main`, `type`), and scripts (`start`, `dev`, `test`, `seed`, `report`, `deploy:arc`) are **100% identical** to `origin/main`.
- **`index.html`:** Clean single-page Vite React entry root replacing the legacy monolithic HTML.
- **`.gitignore`:** Single additive line (`dist/`) preserving clean build segregation.

## 4. Backend Integrity Proof
Execution of `git diff origin/main integration/backend-wiring` across all protected backend paths (`server.js`, `services/`, `ledger/`, `scripts/`, `test/`, `lib/`, `src/PolicyWallet.sol`, `foundry.toml`, `.env.example`, `README.md`, `Vestiarion_AI_PRD_v5_0 (1).md`) excluding the 12 approved `public/` deletions is **100% EMPTY**. Zero backend logic was altered. The backend exposes 6 unauthenticated POST routes (including uncataloged `POST /api/sanctions/check`); frontend live mode contains zero POST requests and zero mutations.

## 5. Development & Testing
- **Run Isolated Mock Server:** `node tools/mock-api.mjs` (serves fixtures on `:4010`)
- **Run Frontend Dev Server:** `npm run dev:ui` (Vite on `http://localhost:5173`)
- **Run Build:** `npm run build:ui` (`tsc && vite build`)
- **Run Verification Suite:** `npx tsc --noEmit && npx vite build && node tools/run-api-tests.mjs && node tools/frontend-guard.mjs`

## 6. Architectural Decisions & Proxy Policy (Decision D8)
- **Baseline Proxy Removal:** The baseline proxied `/api` to `:4000` for everyone, so flag-off dev could show live backend data and its legacy POST buttons reached the real backend if it was running; commit C1 removed that.
- **Current Live Data Access:** To see live backend data: `VITE_USE_LIVE_DATA=true`, with `API_PROXY_TARGET` defaulting safely to the mock on `:4010` (`:4000` only if set explicitly).

## 7. Deployment & Dependency Notes
- **Deployment Configuration:** No deployment manifests (e.g. Render, Railway, Docker, Procfile, Vercel) exist in the repository. The host dashboard setup is unknown, so ask the backend owner whether their host runs a `"build"` script.
- **Dependency Audit:** Running `npm uninstall ... --package-lock-only --dry-run` printed `"up to date"` and was inconclusive, so `framer-motion` and `webgl-fluid` stay for now.

## 8. Review Reference & Rollback
- **Security & Route Observations:** [BACKEND_CHANGE_REQUESTS.md](file:///c:/Users/steph/Desktop/Git/Secullarius/docs/integration/BACKEND_CHANGE_REQUESTS.md)
- **Detailed Deletion Log:** [DELETIONS.md](file:///c:/Users/steph/Desktop/Git/Secullarius/docs/integration/DELETIONS.md)
- **Rollback Option:** Revert PR or restore pre-cleanup tag via `git restore --source=pre-cleanup --staged --worktree -- public Public`.
