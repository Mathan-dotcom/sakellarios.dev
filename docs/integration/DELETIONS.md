# Tracked File Deletions Record

**Branch:** `integration/backend-wiring`  
**Reference Baseline Tag:** `pre-cleanup` (`9af36f6`)  
**Guiding Rule:** Exact file paths deleted via `git rm`. Every deletion is recorded here with its exact commit hash and restore command.

---

## Group 1A: Old Express-Served UI (`public/` — 12 Files)

- **Date:** 2026-10-12
- **Reason:** Legacy Express-served vanilla editorial UI removed for backend owner review. Deprecates static asset serving in favor of the production React + Vite application.
- **Commit Hash:** `275d6a7` (`remove old Express-served UI (for backend owner review)`)
- **Exact File List (12 paths):**
  1. `public/css/components.css`
  2. `public/css/responsive.css`
  3. `public/css/styleguide.css`
  4. `public/index.html`
  5. `public/js/app.js`
  6. `public/js/audit-ledger.js`
  7. `public/js/escalation-queue.js`
  8. `public/js/invoice-workbench.js`
  9. `public/js/sound-effects.js`
  10. `public/js/treasury-dashboard.js`
  11. `public/js/wallpaper.js`
  12. `public/js/yield-manager.js`
- **Future Merge Note:** A future merge of `origin/main` will bring `public/` back if the backend owner edits those files upstream.

---

## Group 1B: Legacy Experimental Assets (`Public/` — 508 Files)

- **Date:** 2026-10-12
- **Reason:** Legacy 3D simulation assets and Three.js examples folder from early prototyping removed from index.
- **Commit Hash:** `945de1e` (`chore(cleanup): remove legacy Public directory assets`)
- **Exact Count:** 508 files under `Public/` (including `Public/supernova.html`, `Public/supernova_explotion_2.html`, and `Public/three/...`).
- **Complete Combined Restore Command:**
  ```bash
  git restore --source=pre-cleanup --staged --worktree -- public Public
  ```

---

## Group 2: Unused `src/` Components

- **Date:** 2026-10-11
- **Reason:** Orphaned components unreachable from Vite entry graph (`index.html` -> `src/main.tsx`). `FluidCursorOverlay.tsx` was superseded by `BleibtgleichCursorOverlay.tsx`; `LedgerDisintegrationStrips.tsx` was superseded by `EuthynaDataLoomCanvas.tsx`.
- **Exact Tracked File List:**
  1. `src/components/FluidCursorOverlay.tsx`
  2. `src/components/LedgerDisintegrationStrips.tsx`
- **Commit Hash:** `601b6cb`
- **One-Line Restore Command:**
  ```bash
  git restore --source=pre-cleanup --staged --worktree -- src/components/FluidCursorOverlay.tsx src/components/LedgerDisintegrationStrips.tsx
  ```
- **Unused Dependencies Note:** Removing `FluidCursorOverlay.tsx` leaves `webgl-fluid` as an unused dependency in `package.json` (report only; `package.json` remains unedited).

---

## Group 3: `saveweb2zip-*` Reference Directories (Index-Only)

- **Date:** 2026-10-11
- **Reason:** Static reference dumps (70 files total) tracked in git index during earlier experiments. Removed from index via `git rm -r --cached` while preserving files on disk. Ignored via `.git/info/exclude`.
- **Exact Tracked File List:**
  - `saveweb2zip-com-bleibtgleich-dev/` (62 files)
  - `saveweb2zip-com-tympanus-net/` (8 files)
- **Commit Hash:** `1af6c4a`
- **One-Line Restore Command:**
  ```bash
  git restore --source=pre-cleanup --staged --worktree -- saveweb2zip-com-bleibtgleich-dev saveweb2zip-com-tympanus-net
  ```
