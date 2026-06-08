# INVESTIGATION-001 — Seed Data Not Visible in UI

Date: 2026-06-08
Investigator: Windows Agent (cc DS)
Status: Resolved

---

## Symptom

Adventure page shows "No worlds available" and Collection page shows "No piece skins yet" / "No board themes yet" on fresh app load, despite TASK-008 and TASK-010 being complete and all review reports confirming curriculum/collection data exists.

## Root Cause

**`seedCoreData()` is never called at application startup.**

The seed function is defined in `src/lib/seed/seed.ts` and is fully tested (204 tests use it and pass), but `src/main.tsx` never imports or invokes it. The application boots with an empty IndexedDB — no worlds, lessons, lines, profiles, achievements, piece skins, or board themes are ever inserted at runtime.

### Evidence

1. Grep for `seedCoreData` in `src/` returns 7 files — all are test files or the seed files themselves. Zero production entry points reference it.

2. `src/main.tsx` — the app entry point — renders the App component directly with no initialization step:

```tsx
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
```

3. `src/services/rewardService.ts` imports from `../lib/seed/defaults.ts` but only for the constant `DEFAULT_USER_ID` — it does not call any seed function.

4. All repository functions (read-only) and hooks (read-only) correctly query IndexedDB. They return empty arrays because the DB has never been populated.

### Non-Issues (verified correct)

- Repository layer: `getAllWorlds`, `getAllPieceSkins`, `getAllBoardThemes` all correctly read from Dexie tables.
- Collection hook (`useCollection`): correctly calls `getAllPieceSkins()` and `getAllBoardThemes()` via `rewardsRepo`.
- Adventure hook (`useAdventureMap`): correctly calls `getAllWorlds()` and `getAllLessonProgress()` via repos.
- Seed idempotency: all seed functions use guards (`count === 0`, `if (!existing)`). Repeated calls are safe.

## Fix

Call `seedCoreData()` in `src/main.tsx` before the first render. The function is idempotent — on subsequent app loads it returns immediately because tables are already populated.

### Changes

**File:** `src/main.tsx`
- Import `seedCoreData` from `./lib/seed/seed.ts`
- Call `await seedCoreData()` before `createRoot(...).render(...)`
- Add a minimal mount guard to ensure seed completes before UI renders

## Risk Assessment

- **Duplicate data (on re-seed):** Very low. All seed functions use per-ID or per-table count guards. `seedCoreData` is idempotent across restarts.
- **Seed failure blocking render:** Low. Wrapped in try/catch so the app still renders even if seed fails. Failure would indicate a deeper IndexedDB issue.
- **Race condition with hooks:** Low. Seed runs and completes before rendering, so all hooks find populated tables on first mount.
- **Performance:** Minimal. Seed runs once on first load (~50-200ms for inserts). On subsequent loads the count guards make it near-instant.

## Related

- REVIEW-008 C-001/C-002: seed upgrade path (adding World 4+ to existing users)
- TASK-006: processTrainingResult (writes to existing progress rows; seeded progress prerequisite)
