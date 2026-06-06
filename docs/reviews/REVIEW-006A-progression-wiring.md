# REVIEW-006A — Progression Wiring

Reviewer: cc Pi (Secondary Pi Agent)
Date: 2026-06-06
Scope: TASK-006A only (processTrainingResult wiring, deriveNodeStatus, canUnlockWorld change, deriveLessonStatus C-002 fix in production path)

---

## Fixes Applied

### F-001 — `useTrainingSession`: stale `.then()` callback overwrites reset `resultProgress`

**File:** `src/hooks/useTrainingSession.ts`

The `.then(({ progress }) => { setResultProgress(progress); })` callback had no guard against a superseded session. If the player tapped "Practice Again" before `processTrainingResult` resolved (IndexedDB round-trips take 5–50ms), `startSession` would clear `resultProgress` to null, then the old promise's `.then()` would fire and overwrite it with stale data from the prior session.

Fix: capture `const capturedLessonId = activeLessonRef.current` before the async call and check `activeLessonRef.current === capturedLessonId` inside `.then()` before calling `setResultProgress`. Same guard pattern already used in `startSession`'s own async body (lines 41, 48, 60).

### F-002 — `processTrainingResult`: degenerate path returned stub, not real stored progress

**File:** `src/services/processTrainingResult.ts`

When `result.totalUserMoves === 0`, the function correctly skipped the DB write — but it returned `makeStubProgress(lessonId)` (zeroed-out: `masteryLevel: 0, perfectRuns: 0`) without reading the actual stored record. A player with 9 perfect runs who triggered a degenerate session would see "Mastery Level: 0, Total Perfect Runs: 0" in the result card despite their real progress being intact in the DB.

`totalUserMoves === 0` is realizable: a 1-move opening line played as Black gives `Math.floor(1/2) = 0`.

Fix: read `getLessonProgress(result.lessonId)` in the degenerate path and return `existing ?? makeStubProgress(lessonId)`. The DB is still not written; only the returned value is corrected.

### F-003 — `deriveNodeStatus` returned raw DB status, so `"review_due"` never showed on the map

**File:** `src/hooks/useAdventureMap.ts`

TASK-006A fixed `deriveLessonStatus` (REVIEW-006 C-002: removed early `return "review_due"` bypass) but never wired it into the adventure map. `deriveNodeStatus` still did `return prog.status` — the raw stored field. Since neither `applyTrainingResult` nor `applyReviewResult` ever writes `status: "review_due"` to IndexedDB (they only write "mastered", "learning", "available"), the stored status is never "review_due". The adventure map therefore never showed a mastered lesson as "review_due", even when its `nextReviewAt` had passed.

Fix: import `deriveLessonStatus` and `nowISO` into `useAdventureMap.ts`. Compute `now = nowISO()` once before the world loop. Change `deriveNodeStatus(lesson, progressMap)` to `deriveNodeStatus(lesson, progressMap, now)`, and inside the function, call `deriveLessonStatus(prog, now)` instead of returning `prog.status`. This wires the C-002 fix into the production display path so "review_due" nodes correctly appear on the map.

### F-004 — `Practice.tsx` displayed next review date in UTC, not local timezone

**File:** `src/features/practice/Practice.tsx`

`resultProgress.nextReviewAt.split("T")[0]` extracted the UTC date from the ISO timestamp. `computeNextReviewDate` stores ISO timestamps in UTC (`from.toISOString()`). For players in positive UTC offsets (e.g. UTC+10), a review scheduled at "2026-06-07T14:00:00.000Z" would display "2026-06-07" when the correct local date is "2026-06-08".

Fix: use `localDateString(new Date(resultProgress.nextReviewAt))` which reads local date fields (`getFullYear()`/`getMonth()`/`getDate()`). `localDateString` was private in `src/lib/date.ts` — exported it as part of this fix.

### F-005 — `useTrainingSession`: two separate `import type` from the same module

**File:** `src/hooks/useTrainingSession.ts`

`PracticeMode` and `LessonProgress` were imported in separate `import type` statements from `../types/domain.ts`, inconsistent with every other file in the codebase that imports multiple types from the same module in a single statement.

Fix: merged into `import type { LessonProgress, PracticeMode } from "../types/domain.ts"`.

---

## Checklist Results

- Practice completion calls progression processing: ✓ (via `handleMove` → `processTrainingResult`)
- Perfect runs persist to LessonProgress: ✓
- Guided runs with mistakes do not count as perfect: ✓ (`result.perfectRun = false` → `applyTrainingResult` non-perfect path)
- Instinct failures do not reduce mastery: ✓ (F-001/F-002 from REVIEW-006 preserved; `applyTrainingResult` guards mastered status)
- Review failures remain the only mastery decay path: ✓ (`applyReviewResult` with 2 failures is the only decay)
- Adventure Map can reflect updated mastery after practice: ✓ (map re-fetches from IndexedDB on mount; F-003 wires `deriveLessonStatus` so review_due now shows)
- Completion logic consistently uses `masteryLevel >= 4`: ✓ (C-004 from REVIEW-006 applied in TASK-006A: `canUnlockWorld`, `applyProgressiveUnlock`, `masteredCount`, `allMastered` all use `masteryLevel >= 4`)
- UI does not access Dexie directly: ✓ (all DB access through `processTrainingResult` → `getLessonProgress`/`upsertLessonProgress`)
- Tests cover the integration: ✓ (117/117 pass; `deriveLessonStatus` tests cover C-002 fix)
- Build passes: ✓
- Lint passes: ✓
- Tests pass: ✓ (117/117)
- HANDOFF updated: ✓

---

## Larger Concerns

### C-001 — Silent `.catch(() => {})` swallows IndexedDB quota errors with no user feedback

**File:** `src/hooks/useTrainingSession.ts`

All errors from `processTrainingResult` — including `QuotaExceededError` (storage full), `InvalidStateError` (DB closed mid-session), and schema errors — are silently swallowed. When a write fails, `resultProgress` stays `null` (no progress section shows in the result card), the mastery level is not updated in the DB, and the user sees no indication that their progress was not saved. For a children's chess app where mastery tracking is the core product value, silent data loss at the moment of first mastery (10th perfect run) is a meaningful failure.

**Recommended fix:** Call `setError(...)` in the catch block for storage-related failures, or add a dedicated `hasPersistenceError: boolean` field to the hook's return type that `Practice.tsx` can use to show a warning ("Your progress could not be saved — storage may be full").

### C-002 — Fire-and-forget persistence inside `handleMove` is the wrong abstraction depth

**File:** `src/hooks/useTrainingSession.ts`

`handleMove` is a synchronous move-submission callback. Burying an async DB write inside it means the hook has dual responsibility: drive training session state AND own persistence. Callers of `useTrainingSession` (e.g., a future review mode, Classic mode) cannot opt out of persistence, cannot observe the persistence lifecycle, and cannot apply different persistence strategies. `Practice.tsx` already observes `result` going non-null; a cleaner seam is to call `processTrainingResult(result)` from `Practice.tsx` (or a `useEffect` watching `result`) instead of burying it inside the hook.

This is a design concern, not a blocking bug. It compounds with C-001: surfacing errors is easier if the caller owns persistence.

### C-003 — Adventure map may show stale data if user navigates back before `processTrainingResult` resolves

**File:** `src/hooks/useTrainingSession.ts` / `src/hooks/useAdventureMap.ts`

`processTrainingResult` is fire-and-forget. If the player sees the terminal result screen and immediately taps "Back to Map" before the IndexedDB write completes, the adventure map mounts and calls `getAllLessonProgress()` before the new `LessonProgress` row is committed. The map would render the lesson at its pre-session mastery level. On the next visit the map would show the correct state.

This window is narrow (~5–50ms for the IDB write) but real on a Raspberry Pi tablet under storage pressure. The fix from C-002 (moving persistence to the caller) would allow `Practice.tsx` to await completion before enabling navigation, or show a brief "Saving..." state before the back button becomes active.

### C-004 — `applyProgressiveUnlock` skip guard still reads raw `prog.status`, not derived status

**File:** `src/hooks/useAdventureMap.ts`

The skip guard at line 57:
```ts
if (prog && prog.status !== "locked") continue;
```
reads `prog.status` from the raw `progressMap` (the DB-stored value), while `node.status` is now set by `deriveLessonStatus`. For a mastered lesson with overdue review, `prog.status` is "mastered" (stored) and `node.status` is "review_due" (derived). The skip guard correctly skips it (prog.status "mastered" ≠ "locked"). No functional difference here, but two different sources of truth are used within the same function, which is fragile if a future change introduces a status value that reads differently between raw and derived.

This is a low-priority structural note. The two-source pattern is benign for all current status values.
