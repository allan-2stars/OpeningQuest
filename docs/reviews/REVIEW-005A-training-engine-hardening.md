# REVIEW-005A — Training Engine Hardening

**Reviewer:** cc Pi (Secondary Pi Agent)
**Task:** TASK-005A — REVIEW-005 Training Engine Correctness Fixes
**Diff range:** 57fcf1d..c8edb62
**Review date:** 2026-06-06

---

## Summary

TASK-005A correctly resolved all five REVIEW-005 concerns: guided-mode mistakes now count, perfectRun is false after any guided wrong move, the move counter uses user moves not plies, lessonId flows through submitMove as a parameter, and mode switching properly restarts the session. 81/81 tests pass. Build and lint clean.

Two small fixes applied. Four larger concerns documented below.

---

## Applied Fixes

### F-001 — StrictMode double-invocation of `startSession` (correctness)

**File:** `src/features/practice/Practice.tsx:29`

TASK-005A removed `startedRef` and replaced the effect with `useEffect(fn, [])` with an eslint-disable comment. In React 18 StrictMode (confirmed present in `src/main.tsx:8`), effects with empty deps still fire twice in development: mount → unmount → remount. Both invocations share the same `lessonId`, so the cancellation guard in `startSession` (`activeLessonRef.current !== lessonId`) cannot distinguish them — both async DB reads run and both call `setState(initSession(...))`, racing to set the initial board state.

Fixed by re-introducing `startedRef` in the effect body without a cleanup. Since React preserves ref values across StrictMode's virtual unmount/remount cycle, `startedRef.current = true` set during the first invocation blocks the second, while `switchMode()` handles mode changes correctly through its own separate code path.

### F-002 — Terminal "Switch to" button duplicated `switchMode` logic inline (maintainability)

**File:** `src/features/practice/Practice.tsx:176`

The "Switch to Instinct/Guided" button at the session terminal manually inlined `setMode(newMode); startSession(lessonId, newMode)` — the same two operations as `switchMode`. If `switchMode` ever acquires a third side-effect (input reset, analytics event, telemetry), the terminal button would silently diverge.

Fixed by replacing the inline body with `switchMode(mode === "guided" ? "instinct" : "guided")`.

### F-003 — TASK-005A HANDOFF.md commit hash was "N/A (pending)"

**File:** `docs/HANDOFF.md`

Updated to the actual commit hash after this review's commit.

---

## Larger Concerns

### C-001 — Mode switch triggers a full DB re-read and loading flash

**File:** `src/hooks/useTrainingSession.ts:26`

`switchMode(newMode)` calls `startSession(lessonId, newMode)`, which unconditionally runs `getLesson` + `getOpeningLine` (two sequential IndexedDB reads) and sets `isLoading = true`. This clears the board and shows the loading spinner on every mode change, even though `sanMoves`, `lesson.side`, and `lessonTitle` are already loaded in the hook's state.

The minimal fix is a separate `reinitSession(newMode: PracticeMode)` path in `useTrainingSession` that skips the DB reads and calls `initSession(sanMoves, cachedSide, newMode)` directly, resetting only the training state. `cachedSide` would need to be persisted in a ref alongside `sanMoves`.

**Recommended fix (for TASK-006 or a follow-up):** Add `reinitSession(mode)` to the hook, call it from `switchMode` and the terminal button. `startSession` remains the entry point for loading a new lesson.

### C-002 — `initSession` with zero `totalUserMoves` produces a stuck session

**File:** `src/features/training/trainingEngine.ts:49`

When `initSession` is called with `totalUserMoves === 0` — either `sanMoves = []` for white, or `sanMoves = ["e4"]` for black — the function returns `status: "waiting"` with no user moves to play. The move input card is rendered (because `isTerminal` is false), and the counter displays "Move 1 of 0". Any submitted move computes `expected = sanMoves[currentMoveIndex] = undefined`, so `isCorrect = (playedSan === undefined) = false` always — the session is permanently stuck in wrong-feedback loop with no path to completion.

Current seeded curriculum always provides 5–7 move lines, so this only manifests with malformed data. There is no test exercising `submitMove` against a zero-userMoves initial state.

**Recommended fix:** In `initSession`, after computing `totalUserMoves`, if it is 0 set `status: "complete"` immediately. Add a test: `initSession([], "white", "guided")` and `initSession(["e4"], "black", "guided")` should both produce `status: "complete"` without reaching `submitMove`.

### C-003 — `handleMove` reads `activeLessonRef` live while `state`/`sanMoves` are stale-captured

**File:** `src/hooks/useTrainingSession.ts:65`

`handleMove` is memoized on `[state, sanMoves]` — these are snapshot values from the render when the callback was last created. But `lessonId` is read from `activeLessonRef.current` live at call time. If `startSession` is called (synchronously updating `activeLessonRef.current` to a new lessonId) while a stale `handleMove` closure is still reachable, `submitMove` will be called with `stateA` + `sanMovesA` from the old session but tagged with the new `lessonId` from the ref. The result would record moves from the wrong session under the new lesson's identity.

In the current UI this window is narrow: the move input card is hidden in terminal states and the "Practice Again" button requires terminal state, so the race requires a Retry-button click mid-session or a rapid input-field submission concurrent with a session reset. It is not directly triggerable through normal play.

**Recommended fix:** In `handleMove`, after `submitMove` returns, guard `setState(next)` and `setResult(sessionResult)` with a check that `activeLessonRef.current === lessonId` (same pattern as the guards in `startSession` lines 36 and 43). This ensures a stale callback's result is silently discarded if the session changed mid-flight.

### C-004 — `buildFeedback` `type` parameter is ignored in the `!legal` branch

**File:** `src/features/training/trainingEngine.ts:18`

```ts
function buildFeedback(type: FeedbackType, legal: boolean, ...): MoveFeedback {
  if (!legal) {
    return { type: "wrong", ... };  // type param silently discarded
  }
  if (type === "opponent") { ... }
  ...
}
```

If `buildFeedback("opponent", false, ...)` were ever called, the function would return `type: "wrong"` instead of `type: "opponent"`. The `type` parameter is consulted only in the second branch. All current call sites pass `"wrong"` or `"accepted"` when `legal` is false (the opponent auto-play branch at line 147 always has `legal: true` because it only runs after a successful `chess.move()`), so the bug is latent. But the function's signature implies `type` is the caller's declared intent — code paths that read `type` before `!legal` and code paths that read `!legal` before `type` have different contracts.

**Recommended fix:** Move the `if (type === "opponent")` check before the `if (!legal)` check. Opponent auto-play moves from the seeded curriculum should never be illegal, but if they are, the error is caught and rethrown by the surrounding try/catch with a descriptive message — there is no case where `type = "opponent"` and `legal = false` reaches `buildFeedback` through a non-error path.

---

## Checklist

| Check | Result |
|---|---|
| Guided wrong moves increment mistakes | ✅ `state.mistakes + 1` in guided wrong path |
| Guided wrong moves prevent perfectRun | ✅ `mistakes === 0` check in `makeResult` |
| Instinct wrong move fails immediately | ✅ `status: "failed"` + result on wrong move |
| Wrong attempts separate from accepted moves | ✅ `type: "wrong"` in history vs `type: "accepted"` |
| Auto-played opponent moves separate in history | ✅ `type: "opponent"` entries in history |
| Move counter shows user move count | ✅ `userMoveCount + 1` of `totalUserMoves` |
| Direct engine result includes lessonId | ✅ `lessonId` parameter flows through `submitMove` → `makeResult` |
| Mode switching works correctly | ✅ `switchMode()` calls `startSession` (F-001 fix guards StrictMode) |
| Build passes | ✅ |
| Lint passes | ✅ |
| Tests pass | ✅ 81/81 |
| Docker Compose runs | Not re-verified (no infrastructure changes) |
| HANDOFF.md updated | ✅ Commit hash filled in (F-003) |
| PROJECT_STATE.md updated | ✅ Status: TASK-005 Complete (done by Windows Agent) |
