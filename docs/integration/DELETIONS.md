# Tracked File Deletions Record

**Branch:** `integration/backend-wiring`  
**Reference Baseline Tag:** `pre-cleanup` (`9af36f6`)  
**Guiding Rule:** Exact file paths deleted via `git rm`. Every deletion is recorded here with its exact commit hash and one-line restore command.

---

## Group 2: Unused `src/` Components

- **Date:** 2026-10-11
- **Reason:** Orphaned components unreachable from Vite entry graph (`index.html` -> `src/main.tsx`). `FluidCursorOverlay.tsx` was superseded by `BleibtgleichCursorOverlay.tsx`; `LedgerDisintegrationStrips.tsx` was superseded by `EuthynaDataLoomCanvas.tsx`.
- **Exact Tracked File List:**
  1. `src/components/FluidCursorOverlay.tsx`
  2. `src/components/LedgerDisintegrationStrips.tsx`
- **Commit Hash:** PENDING_COMMIT_GROUP_2
- **One-Line Restore Command:**
  ```bash
  git checkout pre-cleanup -- src/components/FluidCursorOverlay.tsx src/components/LedgerDisintegrationStrips.tsx
  ```
- **Unused Dependencies Note:** Removing `FluidCursorOverlay.tsx` leaves `webgl-fluid` as an unused dependency in `package.json` (report only; `package.json` remains unedited).

---

## Group 3: `saveweb2zip-*` Reference Directories (Index-Only)

- **Date:** 2026-10-11
- **Reason:** Static reference dumps (70 files total) tracked in git index during earlier experiments. Removed from index via `git rm -r --cached` while preserving files on disk. Ignored via `.git/info/exclude`.
- **Exact Tracked File List:**
  - `saveweb2zip-com-bleibtgleich-dev/` (62 files)
  - `saveweb2zip-com-tympanus-net/` (8 files)
- **Commit Hash:** PENDING_COMMIT_GROUP_3
- **One-Line Restore Command:**
  ```bash
  git checkout pre-cleanup -- saveweb2zip-com-bleibtgleich-dev saveweb2zip-com-tympanus-net
  ```

---

## Group 1: Legacy Express-Served UI (`public/` & `Public/`)

- **Status:** PENDING USER APPROVAL (Part C)
- **Files:** 12 tracked files under `public/` (friend's on `origin/main`), 508 tracked files under `Public/` (mine).
