# REVIEW-004 — Adventure Map

**Reviewer:** cc Pi (Secondary Pi Agent)
**Task:** TASK-004 — Adventure Map
**Diff range:** 733e939..e92ee66
**Review date:** 2026-06-05

---

## Summary

Adventure map implementation is solid: WorldCard/LessonNode reuse is correct, no Dexie access in UI, DEV-gated design-system route, cancellation pattern in async hook, build/lint/tests pass. Four small bugs were fixed in this review pass. Three larger concerns are documented below for the implementer to address.

---

## Applied Fixes

### F-001 — QGA lesson titled "QGD Accepted" (content typo)

**File:** `src/lib/seed/curriculum.ts:129`

`lesson_w2_qga` had `title: "QGD Accepted"`. The ID suffix `qga` and the line PGN (`1. d4 d5 2. c4 dxc4 ...` — pawn captured) confirm this is Queen's Gambit **Accepted**. "QGD" (Declined) in the title was wrong and would teach incorrect chess terminology to the target audience.

Fixed to `title: "QGA Accepted"`.

### F-002 — `masteredCount` excluded `review_due` nodes, diverging from world-unlock logic

**File:** `src/hooks/useAdventureMap.ts:92`

`masteredCount` (shown in WorldCard progress bar and fraction label) counted only `status === "mastered"`. The `allMastered` world-completion check accepted `"mastered" || "review_due"`. When any node was `review_due`, the world would unlock correctly but the WorldCard would show e.g. "5/6" — implying incomplete — while the system treated the world as done.

Fixed `masteredCount` filter to also include `review_due`, matching `allMastered` semantics.

### F-003 — Legend showed 📖 for Available but LessonNode rendered no icon

**Files:** `src/components/LessonNode.tsx:14`, `src/features/adventure/Adventure.tsx:156`

`statusConfig.available.icon` was `""` (empty string). The node renders `{icon && <span>...</span>}`, so available nodes showed no icon. The Adventure map legend promised 📖 but nodes were empty — the legend was misleading.

Fixed by adding `"📖"` to `statusConfig.available.icon`. Also added `"📘"` to `statusConfig.learning.icon` (in-progress nodes had no icon and no legend entry).

### F-004 — `learning` status absent from Adventure map legend

**File:** `src/features/adventure/Adventure.tsx:157`

The legend documented locked/available/mastered/review_due/boss but not `learning`. Any player with an in-progress lesson would see a distinctly coloured node with no legend explanation.

Added `📘 Learning` legend entry between Available and Mastered.

### F-005 — TASK-004 HANDOFF.md commit hash was "N/A (pending)"

**File:** `docs/HANDOFF.md:37`

Updated to `e92ee66` (the actual TASK-004 implementation commit).

---

## Larger Concerns

### C-001 — Sequential world fetches multiply load latency (efficiency)

**File:** `src/hooks/useAdventureMap.ts:61-64`

`getLessonsByWorld(w.id)` is awaited inside a `for` loop, serialising all world fetches. Additionally, `getLessonsByWorld` in `curriculumRepo.ts` re-fetches the world record from IndexedDB even though the caller already holds all worlds from `getAllWorlds()`. With 2 worlds this doubles the lesson-load time for no benefit. As the curriculum grows to 10+ worlds on low-end tablets, this serial pattern will accumulate.

**Recommended fix (for TASK-005 or a follow-up):** Accept `world.lessonIds` as a direct parameter to avoid the redundant world re-read, and consider batch-fetching all worlds' lessons in parallel before the sequential unlock computation.

### C-002 — `isFirstAvailable` fallback only ever marks `idx === 0` as available (latent unlock gap)

**File:** `src/hooks/useAdventureMap.ts:72`

`deriveNodeStatus` falls back to `"available"` only when `isFirstAvailable` is true (computed as `idx === 0 && worldUnlocked`). In V1 this is invisible because `makeDefaultLessonProgress()` seeds every lesson with an explicit status, so `progressMap.get(lesson.id)` always returns a stored status and the fallback is never reached.

If a new lesson is added to the curriculum after a player's first install (e.g., a curriculum update), that lesson has no stored progress record. It would receive `"locked"` for every index except 0, permanently blocking access regardless of what the player has mastered. The within-world progressive unlock logic (lessons unlock after the previous is mastered) is not implemented — it is entirely delegated to seed data.

**Recommended fix:** Implement within-world sequential unlock: after deriving all statuses, pass a second derivation round that marks the first lesson without mastered-or-better status as "available" if the immediately preceding lesson is mastered or review_due. This replaces the seed-dependent fallback with a correct runtime rule.

### C-003 — Legend and `statusConfig` are separate sources of truth

**File:** `src/features/adventure/Adventure.tsx:154-160`, `src/components/LessonNode.tsx:12-18`

The legend is a hand-written list that must be kept in sync with `statusConfig`. They have already diverged once (this review corrected it). As statuses are added or icons change in future tasks, the legend will drift again without any type-level enforcement.

**Recommended fix (low priority):** Export `statusConfig` from `LessonNode.tsx` and derive the legend programmatically from it, or at minimum add a test that asserts all `LessonStatus` values appear in the legend.

---

## Checklist

| Check | Result |
|---|---|
| `/design-system` not in production nav | ✅ DEV-gated in AppShell and App |
| Adventure Map route renders | ✅ `/adventure` renders WorldCard grid + WorldMap |
| World 1 and World 2 present | ✅ Both seeded and displayed |
| Lesson nodes show all states | ✅ locked/available/learning/mastered/review_due all styled |
| Boss node visually distinct | ✅ `isBoss` prop, crown indicator, scale-125 |
| Locked nodes are disabled | ✅ `<button disabled>` + `cursor-not-allowed` |
| Available nodes navigate correctly | ✅ `navigate('/practice/${lessonId}')` |
| No Dexie access in UI components | ✅ All DB access via `useAdventureMap` hook + repos |
| TASK-003 components reused | ✅ WorldCard, LessonNode, FeedbackBanner, EmptyState, PageShell |
| Tablet-first layout | ✅ `sm:` breakpoints, fluid grid |
| Build passes | ✅ `vite build` clean |
| Lint passes | ✅ `eslint .` 0 warnings |
| Tests pass | ✅ 48/48 |
| HANDOFF.md updated | ✅ Updated with commit hash in this review |
