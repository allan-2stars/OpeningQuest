# REVIEW-006 — Progression Engine

Reviewer: cc Pi (Secondary Pi Agent)
Date: 2026-06-06
Scope: TASK-006 only (progressionEngine.ts, processTrainingResult.ts, useAdventureMap progressive unlock, tests)

---

## Fixes Applied

### F-001 — `applyTrainingResult`: perfect run on already-mastered lesson set status to "learning"

**File:** `src/services/progressionEngine.ts`, line 85

In the `completed && perfectRun` branch, when `wasJustMastered = false` (the lesson was already mastered before this run), the `else` fell through to `updated.status = "learning"` with no mastery guard. A player with `masteryLevel: 4, perfectRuns: 11` doing a 12th perfect run would have their lesson regress from "mastered" to "learning". Because `canUnlockWorld` checks `status === "mastered" || status === "review_due"`, this could re-lock the next world on every subsequent perfect run.

Fix: added `progress.masteryLevel >= 4 ? "mastered" : "learning"` guard, matching the existing pattern from the `completed && !perfectRun` branch (line 89).

### F-002 — `applyTrainingResult`: instinct failure on mastered lesson set status to "learning"

**File:** `src/services/progressionEngine.ts`, line 94

The `else` branch (instinct failure, `completed = false`) unconditionally set `status = "learning"` with no mastery guard. A player with a mastered lesson who makes one wrong move in instinct mode would have the lesson regress to "learning". Per `GAMEPLAY_SYSTEM.md`, mastery decay only applies to 2 failed reviews — not to instinct failures. Combined with `canUnlockWorld`'s status-based check, this would un-lock the next world after any failed practice attempt.

Fix: same `progress.masteryLevel >= 4 ? "mastered" : "learning"` guard.

### F-003 — `applyProgressiveUnlock`: dead in-place mutation before array slot replacement

**File:** `src/hooks/useAdventureMap.ts`, line 67 (removed)

`allNodes = [...nodes]` is a shallow copy — `allNodes[i]` and `nodes[i]` are the same object reference. The line `node.status = "available"` (where `node = allNodes[i]`) mutated the shared object, which was immediately made irrelevant when `nodes[i] = { ...nodes[i], status: "available" }` replaced the slot in `nodes` with a new object. For the bossNode path, `Object.assign(bossNode, ...)` on the next line performed the same mutation again. The dead write was removed; the replacements at lines 70–74 are the canonical propagation path.

### New Tests Added

Three new tests in `src/services/__tests__/progressionEngine.test.ts`:
- `keeps mastered status on perfect run for already-mastered lesson` (F-001)
- `keeps mastered status on instinct failure for mastered lesson` (F-002)
- `keeps mastered status on non-perfect completion for mastered lesson` (confirms the existing guard on line 89 also tested)

Tests: 112/112 pass after fixes.

---

## Larger Concerns

### C-001 — `applyReviewResult` interval detection uses local date string vs ISO timestamp comparison

**File:** `src/services/progressionEngine.ts`, lines 113–116

```ts
const currentInterval = progress.nextReviewAt
  ? Math.max(0, REVIEW_INTERVALS.findIndex((d) => daysFromNow(d) >= (progress.nextReviewAt ?? "")) ?? 0)
  : 0;
```

`daysFromNow(d)` returns a local date string `"YYYY-MM-DD"` (no time component). `progress.nextReviewAt` is stored as a full ISO timestamp `"YYYY-MM-DDTHH:MM:SS.sssZ"` from `computeNextReviewDate`. JavaScript string comparison between `"2026-06-07"` and `"2026-06-07T12:00:00.000Z"` returns false because the left string is a proper prefix: shorter strings that are prefixes sort before the character at position 10 (`T`). As a result, `findIndex` always returns the index of the NEXT interval rather than the current one.

Consequence: every successful review advances two ladder steps instead of one. After the 1-day review (index 0), `currentInterval = 1` instead of 0, so `nextIndex = 2` (7 days), silently skipping the 3-day step. Over a full review ladder, the player experiences roughly half the number of review repetitions they should.

A secondary issue: `Array.prototype.findIndex` returns `-1` on no match; `?? 0` never fires because `-1` is not null/undefined. `Math.max(0, -1)` correctly clamps to 0, but this means a player at the maximum 365-day interval would have `currentInterval = 0, nextIndex = 1` (3 days) on every success — resetting the entire ladder after reaching the longest interval.

The HANDOFF acknowledges the comparison as non-deterministic but understates the impact: it silently skips intervals on every success, not just at boundaries.

**Recommended fix:** Store `reviewIndex: number` in `LessonProgress` and increment it directly in `applyReviewResult` rather than reverse-engineering it from date strings. This removes the comparison entirely and is deterministic. Requires a data model migration (add `reviewIndex` field with default 0, store it in `computeNextReviewDate` callers).

Alternatively without a data model change: compute elapsed days as ISO-to-ISO arithmetic (`new Date(nextReviewAt) - new Date(nowISO)`) and find the matching interval index that way — but this degrades when reviews are done overdue and still produces an approximation.

### C-002 — `deriveLessonStatus` early return on stored `"review_due"` never re-validates

**File:** `src/services/progressionEngine.ts`, line 38

```ts
if (progress.status === "review_due") return "review_due";
```

Once a lesson's `status` is stored as `"review_due"`, this function short-circuits immediately without checking `masteryLevel` or whether the review date has already passed. This means:

1. A lesson with `masteryLevel: 2` and a stale `status: "review_due"` (data bug or prior schema error) would show as "review_due" even though it is not mastered.
2. After a successful review, the DB write sets `status: "mastered"`, but any consumer reading a cached snapshot would see stale "review_due" if they call `deriveLessonStatus` before the DB write propagates.

The correct implementation should ignore the stored status entirely and re-derive it from `masteryLevel` and `nextReviewAt`. The `isReviewDue(nextReviewAt, nowISO)` check already provides this logic on line 41 — the early return on line 38 should be removed.

**Note:** `deriveLessonStatus` is exported but has no call sites outside of tests as of TASK-006. When it is wired in, this issue will surface.

### C-003 — `processTrainingResult` is not wired to the Practice page

**File:** `src/services/processTrainingResult.ts`

All progression engine logic (`masteryLevel`, `perfectRuns`, `nextReviewAt`, `status` updates) is computed by `applyTrainingResult` but only persisted via `processTrainingResult`. The Practice page (`src/features/practice/Practice.tsx`) completes training sessions and receives `TrainingSessionResult` via `useTrainingSession`, but never calls `processTrainingResult`. No lesson progress is ever written to IndexedDB during actual gameplay.

This means the adventure map always shows lessons at their seed state, mastery never increments, and the review calendar never receives entries. The entire progression system is functionally inert in the current build.

Acknowledged in TASK-006 HANDOFF as a known issue. Unblocking this requires wiring `processTrainingResult(result)` into `useTrainingSession` or `Practice.tsx` when a session result is emitted. This is the highest-priority follow-up for TASK-007 or a dedicated wiring task.

### C-004 — `canUnlockLesson` and `canUnlockWorld` use inconsistent "mastery complete" signals

**File:** `src/services/progressionEngine.ts`, lines 150–172

`canUnlockLesson` checks `p.masteryLevel >= 4` (numeric, never decremented by practice failures). `canUnlockWorld` checks `p.status === "mastered" || p.status === "review_due"` (string field, written by `applyTrainingResult` and `applyReviewResult`).

These two signals are now more consistent after fixes F-001 and F-002 (which prevent `status` from regressing to "learning" on practice failures for mastered lessons). However, they can still diverge if any code path writes `masteryLevel: 4` without also writing `status: "mastered"`, or writes `status: "mastered"` without `masteryLevel >= 4`.

The `masteryLevel` field is the authoritative measure of mastery; `status` is a UI-facing derived field. Either standardize both functions on `masteryLevel >= 4`, or introduce a `isMastered(progress)` predicate that both functions call. The current inconsistency means that reasoning about unlock behavior requires tracking two separate fields.
