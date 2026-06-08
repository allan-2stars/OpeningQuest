# REVIEW-010A — Seed Data Wiring

Reviewer: cc Pi (Secondary Pi Agent)
Date: 2026-06-08
Investigation reviewed: INVESTIGATION-001 (seed data not visible in UI)

---

## Summary

INVESTIGATION-001 correctly identified the root cause and applied a minimal, correct fix.
No inline fixes needed. Two minor concerns documented below for awareness.

---

## Root Cause Verification

**Confirmed correct.**

`seedCoreData()` was never called at application startup. `src/main.tsx` mounted the
React tree directly with no initialization step, leaving IndexedDB empty on every fresh
install. All hooks and repositories were working correctly — they simply had nothing to
read.

Evidence cited in the investigation document was verified:
- `grep -r seedCoreData src/` returns only test files and seed files — zero production
  entry points before this fix.
- All repository read functions (`getAllWorlds`, `getAllPieceSkins`, `getAllBoardThemes`)
  correctly query Dexie; they returned empty arrays because the tables were never populated.
- `seedCoreData` uses per-ID existence guards (`db.pieceSkins.get(id)`,
  `db.boardThemes.get(id)`, `db.userProfile.get(id)`) and a per-ID filter for achievements.
  It is genuinely idempotent — repeated calls are safe.

---

## Fix Review

**Minimal and correct.**

```tsx
async function boot() {
  try {
    await seedCoreData();
  } catch {
    console.error("Failed to seed core data — app may show empty states.");
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
}

boot();
```

- Seed runs before the first render — hooks find populated tables on their first mount.
- Try/catch makes seed failure non-fatal — the app degrades to empty states rather than
  a hard crash.
- `seedCoreData` is called in `main.tsx` (bootstrap layer), not in any UI component.
  No architecture violation: the rule is "UI never touches Dexie directly" and
  main.tsx is the pre-render entry point, not a component.

---

## Architecture Verification

- [x] UI does not access Dexie directly — `main.tsx` → `seedCoreData()` → seed functions → Dexie.
      The call chain remains: bootstrap → seed → repositories → Dexie.
- [x] No new repository bypasses introduced.
- [x] Hooks and components unchanged — they still read through rewardsRepo and curriculumRepo.

---

## Checklist

- [x] Root cause correctly identified (seedCoreData never called in production)
- [x] Fix is minimal (6 lines added to main.tsx)
- [x] Fix is correct (idempotent seed runs before render)
- [x] No architecture violations
- [x] No direct UI → Dexie access introduced
- [x] Build passes (tsc --noEmit clean)
- [x] Lint passes (eslint 0 errors)
- [x] Tests pass (204/204)

---

## Minor Concerns

### C-001 — boot() unhandled rejection if render throws

**File:** `src/main.tsx`

`boot()` is called without `.catch()`. The try/catch inside `boot()` covers only
`seedCoreData()`. If `createRoot(...).render(...)` were to throw (e.g., due to a runtime
module error at startup), the rejection from `boot()` would be unhandled — no console
error, no visible crash in some environments.

In practice this is near-impossible: React's `render()` does not throw synchronously; it
catches errors internally and routes them to error boundaries. Not worth fixing in this
review, but worth noting for future boot-sequence additions (e.g., migrations, config
loading) that might be added after the seed call.

### C-002 — No integration test for the seed→UI pipeline

Acknowledged in the investigation document's Known Issues. The gap that allowed this bug
to survive 10 tasks and 10 reviews is that all tests call `seedCoreData()` explicitly in
their setup — they never exercised the app's actual entry point. A smoke test that
verifies `main.tsx` imports and invokes `seedCoreData` (or an E2E test that boots the
app and checks for non-empty state) would have caught this immediately.

Acceptable to defer — adding E2E coverage is a separate infrastructure task, not a
collection-system concern.
