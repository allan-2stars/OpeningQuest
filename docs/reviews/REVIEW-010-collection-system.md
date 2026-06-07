# REVIEW-010 — Collection System

Reviewer: cc Pi (Secondary Pi Agent)
Date: 2026-06-08
Task reviewed: TASK-010 (collection UI for piece skins and board themes)

---

## Summary

TASK-010 adds a Collection page with piece skin and board theme grids, selection persistence
via localStorage, and 7 UI tests. Three bugs were fixed inline. Two larger concerns are
documented below.

---

## Fixed Inline

### F-001 — Critical: All 7 Collection tests failed (localStorage.clear not available)

**File:** `src/features/collection/__tests__/Collection.test.tsx`

**Problem:** The `beforeEach` called `localStorage.clear()`. The jsdom environment in
Vitest 4.1.8 exposes a localStorage stub that lacks standard Storage API methods
(`clear`, `removeItem`, etc.), causing all 7 tests to fail with
`TypeError: localStorage.clear is not a function`.

**Fix:** Injected a proper in-memory localStorage mock via `vi.stubGlobal` in `beforeEach`:
```ts
function makeLocalStorageMock() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
}

beforeEach(async () => {
  vi.stubGlobal("localStorage", makeLocalStorageMock());
  // ...
});
```

This also ensures correct test isolation — each test gets a fresh store.

---

### F-002 — Minor: Default selection not persisted to localStorage

**File:** `src/hooks/useCollection.ts`

**Problem:** When no skin/theme is saved in localStorage (first-ever visit), the hook
auto-selects the first unlocked skin/theme and calls `setSelectedSkinId(first.id)` —
but NOT `writeSelected(SELECTED_SKIN_KEY, first.id)`. localStorage remains null.

Any future component that reads `localStorage.getItem("oq_selected_skin_id")` to apply
the skin to the board (e.g., the chessboard renderer in a later task) would get `null`
even though the hook has "selected" a skin. The inconsistency would manifest as the board
showing the default skin rather than the user's selection.

**Fix:** Added `writeSelected` call alongside each `setSelectedSkinId`/`setSelectedThemeId`
in the default-selection path, so localStorage is always in sync with state.

---

### F-003 — Cleanup: Duplicate imports from same module

**File:** `src/hooks/useCollection.ts`

Two separate import lines from `rewardsRepo.ts`:
```ts
import { getAllPieceSkins } from "../lib/repositories/rewardsRepo.ts";
import { getAllBoardThemes } from "../lib/repositories/rewardsRepo.ts";
```
Consolidated to one line (same pattern as F-004 from REVIEW-009).

---

## Larger Concerns (documented for future tasks)

### C-001 — Skin/theme selection not included in JSON backup

**File:** `src/hooks/useCollection.ts`, `src/services/backupService.ts`

The backup service (TASK-009) exports and restores IndexedDB tables. Active skin and
theme selections are stored in localStorage — not IndexedDB — so they are invisible to
the backup system.

A user who exports a backup, wipes their browser, and restores will recover their unlocked
skins and themes (from IndexedDB) but will lose their active selection (from localStorage).
The hook will fall back to auto-selecting the first unlocked item, which is the correct
default, but it may differ from what the user had chosen.

HANDOFF.md for TASK-010 acknowledges localStorage as "adequate for V1". This is
acceptable for now but should be addressed when TASK-011+ adds backup versioning or when
the board renderer begins reading the active skin from localStorage.

### C-002 — `CosmeticCard` and `BoardThemeCard` near-identical components

**File:** `src/features/collection/Collection.tsx`

The two internal card components share identical structure: `canSelect` computation,
`disabled`/`onClick` handling, three nested className ternaries, and Active/Locked badge
rendering. They differ only in the preview content (chess piece icon vs. color swatches)
and their prop type.

For V1 with two cosmetic categories this is acceptable. When TASK-011+ adds mascot
costumes or profile frames (per REWARD_SYSTEM.md), a shared `CollectionCard<T>` with a
`renderPreview` slot would prevent further duplication.

---

## Checklist

- [x] Collection page shows piece skins and board themes
- [x] Locked/unlocked visual states are clear (opacity-50 + 🔒 icon for locked, full opacity + Active badge for selected)
- [x] Locked items cannot be selected (`disabled={true}` + hook guard `skin.unlocked` check)
- [x] Unlocked items can be selected (button click → `selectSkin(id)` → state + localStorage)
- [x] Selected cosmetic persists (localStorage read on init via `readSelected`; written on click and on default)
- [x] UI follows tablet-first design (responsive grid: 2→3→4 columns, large touch targets)
- [x] UI does not access Dexie directly (`Collection.tsx` → `useCollection` → `rewardsRepo`)
- [x] Repository/service boundaries respected (`getAllPieceSkins`, `getAllBoardThemes` from rewardsRepo)
- [x] Build passes (tsc --noEmit clean)
- [x] Lint passes (eslint 0 errors)
- [x] Tests pass (204/204)
- [x] HANDOFF updated
