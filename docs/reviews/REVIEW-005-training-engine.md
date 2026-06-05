# REVIEW-005 — Training Engine

**Reviewer:** cc Pi (Secondary Pi Agent)
**Task:** TASK-005 — Training Engine
**Diff range:** 067232d..f3f45a3
**Review date:** 2026-06-05

---

## Summary

Training engine is well-structured: pure-function design, chess.js used for legal move validation, correct/wrong/illegal move paths correctly separated, Guided and Instinct modes work per spec, perfect run detected, session result carries enough metadata for TASK-006. UI does not access Dexie directly. 68/68 tests passed at baseline. Four fixes applied; five larger concerns documented below.

---

## Applied Fixes

### F-001 — Auto-play loop not wrapped in try/catch (correctness)

**File:** `src/features/training/trainingEngine.ts:128`

The `while` loop that auto-plays opponent moves after a correct user move was outside the `try/catch` that wraps the user's move. If any opponent SAN in the seeded line is invalid for the board position (malformed data), `chess.move()` would throw uncaught, propagate through `submitMove` and `handleMove`, and crash the component with no error message.

Fixed by wrapping the auto-play loop in `try/catch` and rethrowing with a descriptive message (`Invalid opponent move in opening line at position N`).

### F-002 — `handleMove` had no error guard (crash on throw)

**File:** `src/hooks/useTrainingSession.ts:65`

`handleMove` called `submitMove` with no try/catch. Any exception from the engine (e.g., from F-001) would propagate as an unhandled React event error, crashing the component without setting `error` state or giving the user a recoverable path.

Fixed by wrapping `submitMove` in try/catch; exceptions set `error` state, which the Practice page already renders as a `FeedbackBanner` with a Retry button.

### F-003 — `getLesson` and `getLessons` had no tests

**File:** `src/lib/__tests__/repositories.test.ts`

Both functions were added to `curriculumRepo.ts` in this task but were not imported or tested anywhere. `useTrainingSession.startSession` calls `getLesson` at runtime — a regression there would only surface as a user-visible "Lesson not found" error with no automated coverage catching it.

Added 4 tests: happy path for `getLesson`, missing-ID returns `undefined`, `getLessons` with valid IDs returns all, `getLessons` silently filters missing IDs.

Test count: 68 → 72.

### F-004 — Status badge showed raw machine string to users

**File:** `src/features/practice/Practice.tsx:93`

The `Badge` displayed `state.status` directly (`"waiting"`, `"wrong"`, `"failed"` etc.) — developer-facing state machine labels visible to players, including 8-14-year-olds.

Added a `STATUS_LABELS` map and used it for display: `waiting → "Ready"`, `correct → "Correct!"`, `wrong → "Try Again"`, `complete → "Complete!"`, `failed → "Run Failed"`.

### F-005 — TASK-005 HANDOFF.md commit hash was "N/A (pending)"

**File:** `docs/HANDOFF.md`

Updated to `f3f45a3`.

---

## Larger Concerns

### C-001 — Mode change while "waiting" has no effect (functional bug)

**File:** `src/features/practice/Practice.tsx:21–26`

The mode selector buttons are enabled when `state.status === "waiting"` (the initial state after a session loads). Clicking "Instinct" calls `setMode("instinct")` and the `useEffect` re-runs (mode is in its deps), but `startedRef.current === true` prevents `startSession` from firing again. The UI highlights "Instinct" but the session still runs in "guided" mode — wrong moves show hints instead of failing the run.

Additionally, once a first correct move is made, `state.status` becomes `"correct"`, the button guard prevents any further mode change, and the terminal "Change Mode" button calls the same `restart()` as "Practice Again" — it does not provide a way to switch mode.

**Recommended fix:** When a mode button is clicked while `state.status === "waiting"` AND the mode actually changes, reset `startedRef.current = false` and call `startSession(lessonId, newMode)` directly from the click handler rather than relying on the effect. Alternatively, remove `mode` from the `useEffect` deps entirely (it's dead weight there) and make the click handler responsible for restarting.

### C-002 — Move counter displays total plies, not user moves

**File:** `src/features/practice/Practice.tsx:103`

The counter shows `Move {state.currentMoveIndex + 1} of {state.totalMoves}`. `currentMoveIndex` is a raw SAN array index that advances through opponent auto-plays. After playing e4 (user move) and the engine auto-playing e5, `currentMoveIndex = 2`, so the UI shows "Move 3 of 7" when the user has made 1 move. In a 7-ply line, the display will skip even numbers entirely for White and odd numbers for Black.

**Recommended fix:** Expose a `userMoveCount` field in `TrainingSessionState` (incremented only on correct user moves) and `totalUserMoves` (precomputed as `Math.ceil(sanMoves.length / 2)` for White, `Math.floor(sanMoves.length / 2)` for Black). Or derive it from history: `history.filter(m => m.correct).length`.

### C-003 — Guided mode always produces a "perfect run" (mastery design gap)

**File:** `src/features/training/trainingEngine.ts:134`

In guided mode, `state.mistakes` is never incremented — wrong moves are retried without penalty. So every completed guided session returns `perfectRun: true, mistakes: 0`. Since PROGRESSION_SYSTEM.md requires "10 perfect runs = mastered" without specifying mode, guided-mode runs count toward mastery at the same rate as instinct-mode runs.

This means players can achieve mastery (and unlock next-world gates) by doing 10 guided sessions, without ever validating true recall in instinct mode. Instinct mode's mastery-gate purpose is effectively bypassed.

**Recommended fix (for TASK-006):** When persisting a `TrainingSessionResult`, require `mode === "instinct"` for a run to count toward the `perfectRuns` mastery counter. Guided-mode runs can still track `attempts` for analytics without counting as perfect runs toward mastery. Alternatively, define the intended split explicitly in GAMEPLAY_SYSTEM.md.

### C-004 — Guided-mode history and `mistakes` field are inconsistent

**File:** `src/features/training/trainingEngine.ts:96, 118`

When a wrong move is made in guided mode, it is appended to `history` (with `correct: false`) but `mistakes` is not incremented. A completed guided session can have `result.mistakes = 0, result.perfectRun = true` alongside a `result.history` containing multiple wrong-move entries. When TASK-006 persists the result, any review UI that reads both fields (e.g., post-session move list) will show "Perfect run — 0 mistakes" next to a history of failed attempts.

**Recommended fix:** Either (a) filter guided wrong moves out of `history` so the persisted record reflects only the "canonical" line, or (b) add a separate `wrongAttempts` counter distinct from `mistakes` so the data is consistent. Do not change `mistakes` in guided mode — that is correct per the spec — but separate the two concerns.

### C-005 — `makeResult` always emits `lessonId: ""` (incomplete interface)

**File:** `src/features/training/trainingEngine.ts:175`

The training engine is correctly designed as stateless pure functions with no knowledge of which lesson is being practiced. However, `TrainingSessionResult.lessonId` is typed as `string` and always constructed as `""`. The hook patches it at call time via `activeLessonRef.current`. Any future caller that uses `submitMove` directly (a test, a CLI tool, a TASK-006 service) and reads `result.lessonId` before the hook patches it receives an empty string with no type-level warning.

**Recommended fix:** Either remove `lessonId` from `TrainingSessionResult` (make it the caller's responsibility to attach it) and document this in the type, or add `lessonId` as a parameter to `makeResult`. Either approach makes the contract explicit rather than relying on post-construction mutation.

---

## Checklist

| Check | Result |
|---|---|
| chess.js used for legal move validation | ✅ `new Chess(fen).move(san)` — throws on illegal, returns result |
| Expected opening move validation | ✅ `playedSan === expected` (chess.js normalizes to SAN) |
| White and Black user side handling | ✅ `isUserTurn` correct for both sides; Black init plays first move |
| Opponent auto-play | ✅ while loop; now wrapped in try/catch (F-001) |
| Guided Mode allows retry after wrong move | ✅ state unchanged, no mistake count |
| Instinct Mode fails run after wrong move | ✅ status → "failed", result returned immediately |
| Perfect run requires zero mistakes | ✅ `complete && state.mistakes === 0` (see C-003 for guided-mode caveat) |
| Training results carry enough metadata for persistence | ✅ lessonId (patched), mode, completed, mistakes, totalMoves, perfectRun, history |
| Training logic not embedded in React components | ✅ pure functions in `trainingEngine.ts`, hook in `useTrainingSession.ts` |
| UI does not access Dexie directly | ✅ `getLesson` / `getOpeningLine` via repo; no `db.*` in Practice |
| Unit tests cover required cases | ✅ 20 engine tests + 4 new repo tests (72 total) |
| Build passes | ✅ |
| Lint passes | ✅ |
| Tests pass | ✅ 72/72 |
| Docker Compose runs | Not re-verified (infrastructure unchanged) |
| HANDOFF.md updated | ✅ Commit hash filled in (F-005) |
| PROJECT_STATE.md updated | ✅ Status: TASK-005 Complete (done by Windows Agent) |
