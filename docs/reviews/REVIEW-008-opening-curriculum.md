# REVIEW-008 — Opening Curriculum

Reviewer: cc Pi (Secondary Pi Agent)
Date: 2026-06-06
Task reviewed: TASK-008 (opening curriculum data — Worlds 1-3)

---

## Summary

TASK-008 seeded Worlds 1-3 with 8 families, 20 variations, 23 lessons, and 23 opening lines. Chess.js replay tests pass for all lines. Two bugs were found and fixed inline. Two larger concerns are documented below.

---

## Fixed Inline

### F-001 — Critical: World ordering bug (useAdventureMap progression broken)

**File:** `src/types/domain.ts`, `src/lib/seed/curriculum.ts`, `src/lib/repositories/curriculumRepo.ts`

**Problem:** `getAllWorlds()` called `db.worlds.toArray()`, which returns records sorted by primary key (string). The world IDs sort alphabetically as:
1. `world_defender_fortress` (d)
2. `world_knight_meadows` (k)
3. `world_royal_castle` (r)

`useAdventureMap` treats `rawWorlds[0]` as always-unlocked (World 1). With alphabetical ordering, World 3 (Defender Fortress — Black defenses) was always unlocked, and World 1 (Knight Meadows) required World 3 to be complete before unlocking. The entire progression was inverted for new users.

**Fix:** Added `order: number` (1/2/3) to the World type and curriculum data. `getAllWorlds()` now sorts by `order` in memory after fetching. No Dexie schema version bump required (non-indexed field). Added 2 tests:
- `getAllWorlds returns worlds in progression order (not alphabetical key order)`
- `each world has a unique order field`

Also updated the World fixture in `repositories.test.ts` (`order: 1`).

---

### F-002 — Minor: Incorrect depth annotations on Black-side lessons

**File:** `src/lib/seed/curriculum.ts`

**Problem:** For White-side lessons, `depth = ceil(sanMoves.length / 2)` (White plays at even indices 0, 2, 4...). For Black-side lessons, `depth = floor(sanMoves.length / 2)` (Black plays at odd indices 1, 3, 5...). Seven World 3 lessons used the White formula, making their depths off by 1.

`depth` is currently only used as a UI label (`<span>Depth {depth}</span>` in `LessonNode.tsx`). No functional game logic reads it. However, the incorrect values are misleading and would cause problems if `depth` is ever used for difficulty tuning or session configuration.

**Fix:** Corrected depths for all 7 affected Black-side lessons:

| Lesson | sanMoves | Old depth | Correct depth |
|---|---|---|---|
| lesson_w3_caro_main | 7 | 4 | 3 |
| lesson_w3_caro_exchange | 7 | 4 | 3 |
| lesson_w3_french_main | 7 | 4 | 3 |
| lesson_w3_french_exchange | 7 | 4 | 3 |
| lesson_w3_scan_main | 7 | 4 | 3 |
| lesson_w3_scan_queen | 9 | 5 | 4 |
| boss_w3_fortress_commander | 11 | 6 | 5 |

---

## Larger Concerns (not fixed — documented for TASK-009+)

### C-001 — Seed upgrade scenario: existing users don't get World 3 progress rows

**File:** `src/lib/seed/seedCurriculum.ts`

`seedCurriculum()` uses table-level guards:
```ts
if ((await db.lessonProgress.count()) === 0) {
  await db.lessonProgress.bulkAdd(makeDefaultLessonProgress());
}
```

A user who played World 1-2 before TASK-008 shipped will have `lessonProgress.count() > 0`. When they upgrade, World 3 lesson progress rows are NOT seeded. `deriveNodeStatus` returns `"locked"` for any lesson with no progress row.

**Impact for current users:** In development, this is moot since the DB is cleared on schema changes. In production, the adventure map's `applyProgressiveUnlock` can promote World 3 lessons to `"available"` in UI state even without DB rows (since `prog === undefined` makes the node appear locked, which the progressive unlock promotes). The training engine uses `makeStubProgress` for lessons without a DB row. World 3 is effectively playable but inconsistent — UI may show World 3 locked until `applyProgressiveUnlock` runs, and progress accumulates correctly after first practice.

**Recommendation:** When TASK-011+ adds World 4, switch `seedCurriculum` to use per-ID delta seeding (like `seedCoreData`'s achievement pattern):
```ts
for (const lesson of CURRICULUM_LESSONS) {
  const existing = await db.lessonProgress.get(lesson.id);
  if (!existing) {
    await db.lessonProgress.add(makeDefaultProgressFor(lesson.id));
  }
}
```

### C-002 — Table-level count guards prevent incremental curriculum additions

**File:** `src/lib/seed/seedCurriculum.ts`

The `count === 0` guard is all-or-nothing per table. If a future task adds World 4 without clearing the DB, the new world/lesson/line rows will NOT be seeded — the worlds table is already non-empty. Future curriculum expansions require either a full DB wipe (acceptable in dev) or a migration to per-ID upsert (`bulkPut`).

`seedCoreData`'s achievement seeding already uses the per-ID delta pattern. Aligning `seedCurriculum` with that pattern before World 4 is added would avoid a potentially confusing debugging session.

---

## Checklist

- [x] Worlds 1-3 exist (world_knight_meadows, world_royal_castle, world_defender_fortress)
- [x] OpeningFamilies/Variations/Lessons/Lines all linked correctly (tested)
- [x] Every lesson references an existing line (tested)
- [x] Every line replayable by chess.js (23 parameterised tests pass)
- [x] SAN/PGN valid (chess.js replay confirms)
- [x] Seed idempotent — no duplicate rows on re-run (tested)
- [x] Seed does not wipe existing user progress (`if count === 0` guard on lessonProgress)
- [x] Adventure map uses seeded curriculum data via repository pattern (useAdventureMap → getAllWorlds/getLessonsByWorld)
- [x] UI does not access Dexie directly
- [x] Build passes (tsc --noEmit clean)
- [x] Lint passes (eslint 0 errors)
- [x] Tests pass (176/176)
- [x] HANDOFF updated
