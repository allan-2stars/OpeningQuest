# REVIEW-002 - Core Data Layer

Reviewer: cc Pi (Secondary Pi Agent)
Date: 2026-06-04
Task: TASK-002-core-data-layer.md
Commit reviewed: c211e3f

---

## Summary

TASK-002 is functionally complete. Domain models match DATA_MODEL.md. Dexie initializes cleanly with 12 tables. Four repository modules abstract storage correctly. No UI code touches Dexie directly. 25 tests covered basic CRUD flows. Build, lint, and tests all passed.

Four confirmed bugs were fixed during this review. Three larger concerns are documented below.

---

## Applied Fixes

### FIX-001: Achievement unlock state erased on every app launch (CRITICAL)

**File:** `src/lib/seed/seed.ts`

**Bug:** `seedCoreData()` called `db.achievements.bulkPut(DEFAULT_ACHIEVEMENTS)` unconditionally on every run. Dexie `bulkPut` replaces records wholesale. The `DEFAULT_ACHIEVEMENTS` objects have no `unlockedAt` field. Any achievement a player had unlocked would have its `unlockedAt` erased silently the next time the app started.

**Fix:** Changed to an add-only pattern: fetch existing achievement IDs, then `bulkAdd` only the ones not yet present. Same pattern applied to `pieceSkins` and `boardThemes`. All operations wrapped in a single Dexie transaction for atomicity (addresses the partial-seed risk as well).

**Test added:** "preserves achievement unlock state across seed calls" verifies the unlock survives a second `seedCoreData()` call.

### FIX-002: updateUserProfile silently discards writes to non-existent records

**File:** `src/lib/repositories/userProfileRepo.ts`

**Bug:** `db.userProfile.update(id, updates)` returns `0` when the key doesn't exist and no row is modified. The return value was discarded. Callers had no way to detect the write was lost.

**Fix:** Capture the return count; throw `Error("UserProfile not found: ${id}")` if count is 0.

**Test added:** "throws when updating a profile that does not exist"

### FIX-003: updateLessonProgress same silent no-op bug

**File:** `src/lib/repositories/lessonProgressRepo.ts`

**Bug:** Identical to FIX-002 for lesson progress rows.

**Fix:** Same pattern — throw on count 0.

**Test added:** "throws when updating progress that does not exist"

### FIX-004: todayDateString() and daysFromNow() returned wrong date in non-UTC timezones

**File:** `src/lib/date.ts`

**Bug:** Both functions used `new Date().toISOString().slice(0, 10)` (or `d.toISOString()` after mutation). `toISOString()` always returns UTC. In timezones behind UTC (UTC-1 through UTC-12), late evening hours produce tomorrow's UTC date, not today's local date. This would corrupt streak tracking and spaced-repetition scheduling.

**Fix:** Extracted a private `localDateString(d: Date)` helper that uses `getFullYear` / `getMonth` / `getDate` to build a YYYY-MM-DD string from local time. Both `todayDateString()` and `daysFromNow()` now return local date strings.

### FIX-005: Test fixture inconsistency — lesson_b referenced lineId "line_002" which had no fixture

**File:** `src/lib/__tests__/repositories.test.ts`

**Bug:** `lesson_b` was inserted with `lineId: "line_002"` but only `line_001` was put into `db.openingLines`. No test currently queried that line, but the inconsistency would mislead future test authors.

**Fix:** Changed `lesson_b.lineId` to `"line_001"`.

### FIX-006: HANDOFF.md commit hash left as "N/A (pending)"

**File:** `docs/HANDOFF.md`

**Fix:** Updated to `c211e3f`.

---

## Larger Concerns (Not Fixed — Notes Only)

### C-001: DEFAULT_USER_PROFILE.createdAt frozen at module import time

`src/lib/seed/defaults.ts` evaluates `createdAt: new Date().toISOString()` at the module level. The timestamp is fixed when the module is first imported, not when `seedCoreData()` actually runs. On slow startup paths the delta is seconds; in test runs sharing a module instance it's the same value for all test runs. Low severity for now — the profile creation time being slightly off is rarely material — but a factory function would be more correct:

```ts
export function makeDefaultUserProfile(): UserProfile {
  return { ...DEFAULT_USER_PROFILE_TEMPLATE, createdAt: nowISO() };
}
```

Defer to TASK-003 or later if/when profile creation timestamps become meaningful.

### C-002: trainingSessions and dailyQuests tables have no repositories

Both tables are declared in the Dexie schema and have domain types, but no repository module exists. The architecture rule is "UI does not access Dexie directly." When TASK-005 (training engine) needs to write `TrainingSession` rows, or a future task handles `DailyQuest` generation, those tasks must create the corresponding repos before touching the DB from feature code.

Recommended: create `src/lib/repositories/trainingSessionRepo.ts` and `src/lib/repositories/dailyQuestRepo.ts` at the start of whichever task first needs them.

### C-003: getUnlockedAchievements / getUnlockedPieceSkins / getUnlockedBoardThemes do full table scans

`rewardsRepo.ts` uses `.filter()` for unlocked-only queries because `unlocked` and `unlockedAt` are not indexed in the Dexie schema. For the small fixed collections in V1 this is acceptable. If the collection grows (many unlockable skins, board themes, achievements), add an index:

```ts
pieceSkins: "id, unlocked",
boardThemes: "id, unlocked",
```

and replace `.filter()` with `.where("unlocked").equals(1)`. Requires a schema version bump. Defer until collection size makes it measurable.

---

## Verification Results

| Check | Result |
|-------|--------|
| Domain models match DATA_MODEL.md | PASS |
| Dexie initializes cleanly (12 tables) | PASS |
| Repositories abstract storage | PASS |
| No UI code touches Dexie directly | PASS |
| `tsc -b` | PASS |
| `eslint .` | PASS |
| `vitest run` | 28/28 PASS (was 25/25) |
| Docker Compose `localhost:4317` | PASS (verified in REVIEW-001) |
| HANDOFF.md updated | YES (after fix) |
| PROJECT_STATE.md current | YES |

---

## Recommendation

TASK-002 is complete with fixes applied. Safe to proceed to TASK-003.
