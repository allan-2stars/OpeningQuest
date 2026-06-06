# HANDOFF.md

# Opening Quest - Handoff Log

Newest entries go at top.

## Template

Date:
Agent:
Task:
Branch:
Commit:
Files Changed:
Tests Run:
Known Issues:
Next Recommended Task:
Notes:

---

## TASK-008 Handoff

Date:
2026-06-06

Agent:
Windows Agent (cc DS)

Task:
TASK-008 - Opening Curriculum Data

Branch:
main

Commit:
N/A (pending)

Files Changed:
- src/lib/seed/curriculum.ts (expanded to Worlds 1-3: 3 worlds, 8 families, 20 variations, 23 lessons, 23 opening lines)
- src/lib/__tests__/curriculum.test.ts (created — 44 validation tests)
- src/lib/__tests__/repositories.test.ts (updated assertions for expanded curriculum)

Tests Run:
- tsc -b (passed)
- eslint . (0 errors, 0 warnings)
- vite build (passed)
- vitest run (174/174 passed: 33 repo + 18 component + 31 training engine + 28 progression + 12 reward calculator + 8 curriculum seed test updates + 44 curriculum validation)
- docker compose up --build (HTTP 200 at /, /adventure)

World 3 — Defender Fortress (Black defences, 7 lessons + boss):
- Caro-Kann Defence: Main Line, Classical Setup, Exchange Variation
- French Defence: Main Line, Exchange Variation
- Scandinavian Defence: Main Line, Queen Development
- Boss: Fortress Commander

Curriculum validation tests:
- Every lesson references an existing line and variation
- Every world lessonId references an existing lesson
- Boss lessons have valid bossBattleId in parent world
- Every variation references an existing family
- Every opening line replays through chess.js from start position (parameterised)
- Every line has >= 4 moves
- Seed is idempotent (no duplicate rows, no progress overwrite)
- World constant exports match world data

Known Issues:
- World 3 lessons are Black-side — totalUserMoves calculation handles correctly per TASK-005 formula

Next Recommended Task:
TASK-009-pgn-import-export.md

Notes:
All 23 opening lines verified replayable by chess.js in curriculum.test.ts. World 3 uses
Black-side openings, giving the training engine its first non-white userSide exercises.
Boss nodes have requiredLessonIds for prerequisite gating (canUnlockLesson-compatible).

---

## REVIEW-007A Handoff

Date:
2026-06-06

Agent:
cc Pi (Secondary Pi Agent)

Task:
REVIEW-007A — Reward Persistence Hardening Review

Branch:
main

Commit:
4e03cde

Files Changed:
- src/services/__tests__/rewardCalculator.test.ts (F-001: added test for wrong-move XP exclusion in computeRewardSummary)
- src/services/rewardService.ts (F-002: removed dead export type { RewardSummary } re-export)
- src/lib/repositories/rewardsRepo.ts (F-003: updatePieceSkin/updateBoardTheme now throw on missing row, consistent with updateAchievement)
- docs/reviews/REVIEW-007A-reward-persistence-hardening.md (created)
- docs/HANDOFF.md (this entry)

Tests Run:
- tsc -b (passed)
- eslint . (0 errors, 0 warnings)
- vite build (passed)
- vitest run (130/130 passed)

Known Issues:
- C-001: Partial persistence when updateAchievement throws — XP/keys already committed to profile, achievement not written; rewardSummary returns null so UI doesn't show XP was actually saved

Next Recommended Task:
TASK-008-opening-curriculum.md

Notes:
F-001 restores a test that was inadvertently dropped when computeSessionXp was removed:
"wrong type entries don't count toward XP" is now tested against computeRewardSummary directly.
F-002 removes a dead re-export (all callers import RewardSummary from rewardCalculator.ts directly).
F-003 makes all three update functions in rewardsRepo.ts consistent — all throw on missing rows.

---

## TASK-007A Handoff (Reward Persistence Hardening)

Date:
2026-06-06

Agent:
Windows Agent (cc DS)

Task:
TASK-007A — REVIEW-007 Reward Persistence Hardening

Branch:
main

Commit:
N/A (pending)

Files Changed:
- src/services/rewardCalculator.ts (C-001: removed dead computeSessionXp with broken API)
- src/services/rewardService.ts (C-002: throw on missing user profile instead of silent skip)
- src/lib/repositories/rewardsRepo.ts (C-003: updateAchievement throws on missing row)
- src/services/__tests__/rewardCalculator.test.ts (removed 5 tests for removed function)

Tests Run:
- tsc -b (passed)
- eslint . (0 errors, 0 warnings)
- vite build (passed)
- vitest run (129/129 passed)
- docker compose up --build (HTTP 200)

Fixed REVIEW-007 concerns:
- C-001: computeSessionXp removed — dead code with misleading wasMastered parameter
  that silently excluded the mastery bonus. computeRewardSummary remains the
  canonical entry point for all reward calculation.
- C-002: applyRewards now throws "User profile not found — seed data may not have
  run" when profile is missing, instead of silently dropping XP/keys while
  showing "+100 XP" in the UI.
- C-003: updateAchievement now throws on missing row (matching the
  updateUserProfile pattern), catching future seed-data gaps at the point
  of failure.

Known Issues:
- REVIEW-006A C-001 through C-004 still tracked in HANDOFF
- REVIEW-006 C-001 (applyReviewResult date comparison) still deferred
- REVIEW-007 C-004 (asymmetric error handling) pre-existing, not addressed here

Next Recommended Task:
TASK-008-opening-curriculum.md

Notes:
All three REVIEW-007 concerns resolved. Reward calculator API is now clean
(computeRewardSummary is the only calculation entry point). Missing profile
and missing achievement rows now surface as explicit errors at the point
of failure rather than silently discarding data.

---

## REVIEW-007 Handoff

Date:
2026-06-06

Agent:
cc Pi (Secondary Pi Agent)

Task:
REVIEW-007 — Reward System Review

Branch:
main

Commit:
6e6d052

Files Changed:
- src/lib/seed/defaults.ts (F-001: added ach_first_perfect_run and ach_first_mastered to DEFAULT_ACHIEVEMENTS)
- src/services/rewardService.ts (F-002: merged duplicate imports; F-003: getAllAchievements → getUnlockedAchievements)
- docs/reviews/REVIEW-007-reward-system.md (created)
- docs/HANDOFF.md (this entry)

Tests Run:
- tsc -b (passed)
- eslint . (0 errors, 0 warnings)
- vite build (passed)
- vitest run (134/134 passed)

Known Issues:
- C-001: computeSessionXp dead code with misleading public API — callers get wrong XP (missing mastery bonus)
- C-002: XP/keys silently dropped when user profile doesn't exist (getUserProfile returns undefined, if (profile) guard skips write)
- C-003: updateAchievement uses Dexie update() not put() — no error signal on missing row; relies on seed invariant
- C-004: Asymmetric error handling — upsertLessonProgress errors propagate as rewardError banner (pre-existing REVIEW-006A C-001)

Next Recommended Task:
TASK-008-opening-curriculum.md

Notes:
F-001 is the critical fix: two achievement IDs ("ach_first_perfect_run", "ach_first_mastered") were referenced
in rewardCalculator.ts but absent from DEFAULT_ACHIEVEMENTS. Without the DB rows, Dexie's update() silently
no-ops, alreadyUnlockedIds never includes them, and the achievements are re-reported as unlocked on every
qualifying session indefinitely. F-002/F-003 are minor cleanup.

---

## TASK-007 Handoff

Date:
2026-06-06

Agent:
Windows Agent (cc DS)

Task:
TASK-007 - Reward System

Branch:
main

Commit:
N/A (pending)

Files Changed:
- src/services/rewardCalculator.ts (created — computeSessionXp, computeAchievementTransitions, computeRewardSummary)
- src/services/rewardService.ts (created — applyRewards: profile XP/keys + achievement unlock persistence)
- src/services/processTrainingResult.ts (updated — calls applyRewards, returns RewardSummary + rewardError)
- src/lib/repositories/rewardsRepo.ts (added updateAchievement, updatePieceSkin, updateBoardTheme)
- src/hooks/useTrainingSession.ts (exposes rewardSummary + rewardError)
- src/features/practice/Practice.tsx (displays reward summary card + persistence error banner)
- src/services/__tests__/rewardCalculator.test.ts (created — 17 tests)

Tests Run:
- tsc -b (passed)
- eslint . (0 errors, 0 warnings)
- vite build (passed)
- vitest run (134/134 passed)
- docker compose up --build (HTTP 200)

Known Issues:
- REVIEW-006A C-001 (silent storage errors) partially addressed — reward errors now surfaced via rewardError
- Boss victory (+250 XP, +3 keys) and world completion (+500 XP, +5 keys) functions exist but not yet wired
- Cosmetic skins/themes have update functions in repo but no unlock rules yet (placeholder)
- Reward persistence errors visible via rewardError banner; progress persistence errors still swallowed (REVIEW-006A C-001)

Next Recommended Task:
TASK-008-opening-curriculum.md

Notes:
XP awards: +1 per correct move, +25 perfect run, +100 first-time mastery.
Keys: +1 first-time mastery.
Achievements: first_lesson (first attempt), first_perfect_run, first_mastered, perfect_10.
All achievement transitions are idempotent — alreadyUnlockedIds prevents re-awarding.
Mastery XP/keys only fire once (oldProgress.masteryLevel < 4 && newProgress.masteryLevel >= 4).
Reward summary displayed in Practice result area after session completion.

---

## REVIEW-006A Handoff

Date:
2026-06-06

Agent:
cc Pi (Secondary Pi Agent)

Task:
REVIEW-006A — Progression Wiring Review

Branch:
main

Commit:
5e9f665

Files Changed:
- src/hooks/useTrainingSession.ts (F-001: stale-session guard in .then(); F-005: merged duplicate imports)
- src/services/processTrainingResult.ts (F-002: degenerate path reads real DB progress)
- src/hooks/useAdventureMap.ts (F-003: deriveNodeStatus wired to deriveLessonStatus; now parameter added)
- src/features/practice/Practice.tsx (F-004: nextReviewAt formatted with localDateString)
- src/lib/date.ts (exported localDateString for F-004)
- docs/HANDOFF.md (this entry)
- docs/reviews/REVIEW-006A-progression-wiring.md (created)

Tests Run:
- tsc -b (passed)
- eslint . (passed)
- vitest run (117/117 passed)

Known Issues:
- C-001: Silent .catch swallows IndexedDB quota errors with no user feedback (see REVIEW-006A)
- C-002: Fire-and-forget persistence in handleMove is the wrong abstraction depth (see REVIEW-006A)
- C-003: Adventure map may read stale data if user navigates back before processTrainingResult resolves (see REVIEW-006A)
- C-004: applyProgressiveUnlock skip guard still reads raw prog.status rather than derived status (see REVIEW-006A)
- REVIEW-006 C-001 (applyReviewResult date comparison interval bug) still deferred

Next Recommended Task:
TASK-007-reward-system.md

Notes:
F-001 (staleness guard) prevents old session progress bleeding into a freshly started session when
the player clicks "Practice Again" quickly. F-002 shows real DB progress (not a zeroed stub) for
degenerate lessons. F-003 wires deriveLessonStatus into the adventure map so review_due nodes
finally show on the map. F-004 corrects the timezone display for next review date.

---

## TASK-006A Handoff (Progression Wiring)

Date:
2026-06-06

Agent:
Windows Agent (cc DS)

Task:
TASK-006A — Wire Progression Engine into Practice Flow

Branch:
main

Commit:
N/A (pending)

Files Changed:
- src/services/progressionEngine.ts (C-002: deriveLessonStatus checks masteryLevel first; C-004: canUnlockWorld uses masteryLevel >= 4)
- src/hooks/useAdventureMap.ts (C-004: applyProgressiveUnlock/masteredCount/allMastered use masteryLevel >= 4)
- src/hooks/useTrainingSession.ts (C-003: wired processTrainingResult call on session completion)
- src/features/practice/Practice.tsx (displays persisted progress: perfectRuns, masteryLevel, nextReviewAt)
- src/services/__tests__/progressionEngine.test.ts (+5 tests: canUnlockWorld masteryLevel edge cases, deriveLessonStatus C-002 verification)

Tests Run:
- tsc -b (passed)
- eslint . (0 errors, 0 warnings)
- vite build (passed)
- vitest run (117/117 passed)
- docker compose up --build (HTTP 200 at /, /adventure, /practice/:lessonId)

Fixed REVIEW-006 concerns:
- C-003: processTrainingResult wired into useTrainingSession → progression persists during gameplay
- C-004: canUnlockLesson and canUnlockWorld both use masteryLevel >= 4 as canonical completion signal
- C-002: deriveLessonStatus no longer returns review_due for non-mastered lessons

Completion signal consistency:
- canUnlockLesson, canUnlockWorld, applyProgressiveUnlock, masteredCount, allMastered
  all use masteryLevel >= 4 as the single canonical completion check
- deriveLessonStatus re-derives from masteryLevel (not stored status string)
- applyTrainingResult preserves mastered status on all practice outcomes (F-001, F-002 from REVIEW-006)

Known Issues:
- REVIEW-006 C-001 (applyReviewResult date comparison) not yet fixed — deferred to data model task

Next Recommended Task:
TASK-007-reward-system.md

Notes:
Practice now actually updates lesson progress. On session completion/failure, processTrainingResult
persists progress via repositories. Adventure map reflects updated mastery when navigating back.
Session result card in Practice shows updated perfectRuns, masteryLevel, and next review date.

---

## REVIEW-006 Handoff

Date:
2026-06-06

Agent:
cc Pi (Secondary Pi Agent)

Task:
REVIEW-006 — Progression Engine Review

Branch:
main

Commit:
a5f2c74

Files Changed:
- src/services/progressionEngine.ts (F-001: mastered-lesson status guard on perfect run; F-002: mastered-lesson status guard on instinct failure)
- src/hooks/useAdventureMap.ts (F-003: removed dead in-place mutation in applyProgressiveUnlock)
- src/services/__tests__/progressionEngine.test.ts (3 new tests for F-001/F-002)
- docs/HANDOFF.md (this entry)
- docs/reviews/REVIEW-006-progression-engine.md (created)

Tests Run:
- tsc -b (passed)
- eslint . (passed)
- vitest run (112/112 passed)

Known Issues:
- C-001: applyReviewResult interval detection uses local date string vs ISO timestamp — skips one review interval on every success (see REVIEW-006)
- C-002: deriveLessonStatus early return on stored "review_due" never re-validates masteryLevel (see REVIEW-006)
- C-003: processTrainingResult not wired to Practice page — progression engine is functionally inert during gameplay (see REVIEW-006)
- C-004: canUnlockLesson (masteryLevel >= 4) and canUnlockWorld (status checks) use inconsistent completion signals (see REVIEW-006)

Next Recommended Task:
Wire processTrainingResult into Practice.tsx / useTrainingSession (C-003 is blocking all gameplay progression)

Notes:
F-001 and F-002 fix the most impactful correctness bugs: any instinct failure or extra perfect run
on an already-mastered lesson would reset status to "learning", triggering false world-unlock
regressions via canUnlockWorld's status-based check. Both paths now apply the same
masteryLevel >= 4 guard that the completed-with-mistakes path already had.

---

## TASK-006 Handoff

Date:
2026-06-06

Agent:
Windows Agent (cc DS)

Task:
TASK-006 - Progression Engine

Branch:
main

Commit:
N/A (pending)

Files Changed:
- src/services/progressionEngine.ts (created — mastery, review, unlock rules)
- src/services/processTrainingResult.ts (created — training→progression bridge)
- src/services/__tests__/progressionEngine.test.ts (created — 28 tests)
- src/features/training/types.ts (added totalUserMoves to TrainingSessionResult)
- src/features/training/trainingEngine.ts (makeResult emits totalUserMoves)
- src/hooks/useAdventureMap.ts (REVIEW-004 C-002 fix — progressive unlock)
- docs/HANDOFF.md (this entry)
- docs/PROJECT_STATE.md (status update)
- docs/tasks/TASK-006-progression-engine.md (status update)

Tests Run:
- tsc -b (passed)
- eslint . (0 errors, 0 warnings)
- vite build (passed)
- vitest run (109/109 passed)
- docker compose up --build (HTTP 200 at /, /adventure, /practice/:lessonId)

Known Issues:
- processTrainingResult not yet wired to Practice page (no auto-persist on session end)
- applyReviewResult uses daysFromNow for interval inference (non-deterministic in tests)
- REVIEW-005A C-001/C-003/C-004 remain as deferred improvements
- Key earning/spending helpers deferred to TASK-007
- No Streak tracking (TASK-007)

Next Recommended Task:
TASK-007-reward-system.md

Notes:
Progression engine is pure-function, deterministic, and fully unit-tested.

Mastery: 0 pr → 0, 1-3 → 1, 4-6 → 2, 7-9 → 3, 10+ → 4.
10th perfect run triggers mastery: status → "mastered", 1-day review scheduled.
Review intervals: 1, 3, 7, 14, 30, 60, 90, 180, 365 days.
2 failed reviews reduce mastery by 1 level, reset failedReviewCount.
Zero-userMoves (degenerate lessons) are safely rejected.
Unlock helpers: canUnlockLesson (prerequisite check), canUnlockWorld (world gate).

REVIEW-004 C-002 fixed: within-world progressive unlock no longer relies solely
on seed data. applyProgressiveUnlock() does a second pass over lesson nodes,
marking the first un-completed node as "available" when the preceding one
is mastered/review_due.

---

## REVIEW-005A Handoff

Date:
2026-06-06

Agent:
cc Pi (Secondary Pi Agent)

Task:
REVIEW-005A — Training Engine Hardening Review

Branch:
main

Commit:
da946ad

Files Changed:
- src/features/practice/Practice.tsx (F-001: startedRef guard, F-002: terminal button uses switchMode)
- docs/HANDOFF.md (TASK-005A commit hash)
- docs/reviews/REVIEW-005A-training-engine-hardening.md (created)

Tests Run:
- tsc -b (passed)
- eslint . (passed)
- vitest run (81/81 passed)

Known Issues:
- C-001: Mode switch triggers full DB re-read + loading flash (see REVIEW-005A)
- C-002: initSession zero-userMoves produces stuck session with "Move 1 of 0" (see REVIEW-005A)
- C-003: handleMove stale closure / activeLessonRef mismatch (see REVIEW-005A)
- C-004: buildFeedback type parameter ignored in !legal branch (see REVIEW-005A)

Next Recommended Task:
TASK-006-progression-engine.md

Notes:
StrictMode double-invocation of startSession fixed by re-introducing startedRef guard (without
cleanup, preserving ref across virtual unmount/remount). Terminal mode-switch button refactored
to call switchMode() instead of duplicating inline logic.

---

## REVIEW-004 Handoff

Date:
2026-06-05

Agent:
cc Pi (Secondary Pi Agent)

Task:
REVIEW-004 — Adventure Map Review

Branch:
main

Commit:
0336db8

Files Changed:
- src/lib/seed/curriculum.ts (QGA title typo fix)
- src/components/LessonNode.tsx (📖 icon for available, 📘 icon for learning)
- src/hooks/useAdventureMap.ts (masteredCount includes review_due)
- src/features/adventure/Adventure.tsx (📘 Learning legend entry)
- docs/HANDOFF.md (TASK-004 commit hash)
- docs/reviews/REVIEW-004-adventure-map.md (created)

Tests Run:
- tsc -b (passed)
- eslint . (passed)
- vitest run (48/48 passed)

Known Issues:
- C-001: Sequential world fetches multiply load latency (see REVIEW-004)
- C-002: isFirstAvailable fallback only marks idx=0 available — within-world unlock not implemented (see REVIEW-004)
- C-003: Legend and statusConfig are separate sources of truth (see REVIEW-004)

Next Recommended Task:
TASK-005-training-engine.md

Notes:
Fixed 5 items: QGA lesson title typo, masteredCount/allMastered semantic mismatch, missing
available/learning icons in LessonNode statusConfig, missing "Learning" legend entry,
and TASK-004 HANDOFF commit hash.

---

## TASK-004 Handoff

Date:
2026-06-05

Agent:
Windows Agent (cc DS)

Task:
TASK-004 - Adventure Map

Branch:
main

Commit:
e92ee66

Files Changed:
- src/app/App.tsx (/design-system DEV guard, /practice/:lessonId route)
- src/components/AppShell.tsx (DS nav DEV guard)
- src/components/Modal.tsx (aria-label fallback, titleless close button)
- src/features/adventure/Adventure.tsx (rewritten — full adventure map)
- src/features/practice/Practice.tsx (updated with lessonId param, EmptyState)
- src/hooks/useAdventureMap.ts (created)
- src/lib/seed/curriculum.ts (created — Worlds 1&2 seed data)
- src/lib/seed/seedCurriculum.ts (created)
- src/lib/seed/seed.ts (wired seedCurriculum into seedCoreData)
- src/lib/__tests__/repositories.test.ts (+1 curriculum seed test)
- docs/reviews/REVIEW-003-design-system-components.md (C-001, C-002 addressed)

Tests Run:
- tsc -b (passed)
- eslint . (passed, 0 warnings)
- vite build (passed, /design-system tree-shaken from production JS)
- vitest run (48/48 passed)
- docker compose up --build (HTTP 200 at /, /adventure; /design-system dev-only)

Known Issues:
- World progression uses simple all-mastered check; real progression engine TASK-006
- Lesson nodes claim unlocked state from seed data only; no dynamic unlocking yet
- Boss node is visual-only; boss battle logic is TASK-013
- REVIEW-002 C-001 (frozen timestamp) still applies

Next Recommended Task:
TASK-005-training-engine.md

Notes:
Adventure map renders Worlds 1 & 2 from seeded curriculum. Lesson nodes show correct visual
states for locked/available/mastered/review_due. Boss node gets crown indicator and
scale boost. World selection via WorldCard grid. Snaking vertical path connects lesson
nodes with left/right alternation. Locked lessons are disabled buttons. Available/current
nodes navigate to /practice/:lessonId.

Preflight fixes applied:
- /design-system route gated behind import.meta.env.DEV (REVIEW-003 C-001)
- Modal aria-label fallback for titleless usage (REVIEW-003 C-002)

---

## TASK-005A Handoff (REVIEW-005 Fixes)

Date:
2026-06-05

Agent:
Windows Agent (cc DS)

Task:
TASK-005A — REVIEW-005 Training Engine Correctness Fixes

Branch:
main

Commit:
c8edb62

Files Changed:
- src/features/training/types.ts (added FeedbackType, userMoveCount, totalUserMoves)
- src/features/training/trainingEngine.ts (C-002 through C-005 fixes)
- src/features/training/__tests__/trainingEngine.test.ts (rewritten — 31 tests, was 20)
- src/hooks/useTrainingSession.ts (passes lessonId to submitMove directly)
- src/features/practice/Practice.tsx (C-001 mode switch fix, C-002 move counter fix)

Tests Run:
- tsc -b (passed)
- eslint . (0 errors, 0 warnings)
- vite build (passed)
- vitest run (81/81 passed: 28 repo + 18 component + 1 curriculum seed + 4 getLesson/getLessons + 30 training engine)
- docker compose up --build (HTTP 200 at /, /practice/:lessonId)

Fixed REVIEW-005 concerns:
- C-001: Mode buttons call switchMode() which restarts session with new mode
- C-002: Move counter now shows userMoveCount+1 of totalUserMoves (user moves, not plies)
- C-003: Guided mode wrong moves count as mistakes
- C-004: Guided runs with any wrong move produce perfectRun=false
- C-005: lessonId is a submitMove parameter, never empty in results
- History entries use type field: "accepted" | "wrong" | "opponent"
- Opponent auto-play moves recorded in history

Known Issues:
- REVIEW-005 C-003 comment about mastery gate (instinct-only perfectRuns) deferred to TASK-006

Next Recommended Task:
TASK-006-progression-engine.md

Notes:
All five REVIEW-005 concerns resolved. Engine now distinguishes accepted moves, wrong
attempts, and opponent auto-plays in history via the FeedbackType union. Practice page
mode buttons restart sessions properly instead of silently ignoring mode changes.

---

## REVIEW-005 Handoff

Date:
2026-06-05

Agent:
cc Pi (Secondary Pi Agent)

Task:
REVIEW-005 — Training Engine Review

Branch:
main

Commit:
089ed5b

Files Changed:
- src/features/training/trainingEngine.ts (auto-play loop try/catch)
- src/hooks/useTrainingSession.ts (handleMove error guard)
- src/lib/__tests__/repositories.test.ts (getLesson + getLessons tests)
- src/features/practice/Practice.tsx (STATUS_LABELS for badge display)
- docs/HANDOFF.md (TASK-005 commit hash)
- docs/reviews/REVIEW-005-training-engine.md (created)

Tests Run:
- tsc -b (passed)
- eslint . (passed)
- vitest run (72/72 passed, was 68/68)

Known Issues:
- C-001: Mode change while "waiting" has no effect — visual mismatch (see REVIEW-005)
- C-002: Move counter displays total plies, not user moves (see REVIEW-005)
- C-003: Guided mode always produces perfect run — mastery design gap (see REVIEW-005)
- C-004: Guided-mode wrong moves in history while mistakes=0 (see REVIEW-005)
- C-005: makeResult always emits lessonId:"" — incomplete interface (see REVIEW-005)

Next Recommended Task:
TASK-006-progression-engine.md

Notes:
Fixed auto-play crash bug (uncaught throw from opponent move), added error recovery to
handleMove, added missing getLesson/getLessons tests, improved status badge display labels,
updated TASK-005 HANDOFF commit hash.

---

## TASK-005 Handoff

Date:
2026-06-05

Agent:
Windows Agent (cc DS)

Task:
TASK-005 - Training Engine

Branch:
main

Commit:
f3f45a3

Files Changed:
- src/features/training/types.ts (created — TrainingSessionState, MoveFeedback, TrainingSessionResult)
- src/features/training/trainingEngine.ts (created — initSession, submitMove)
- src/features/training/__tests__/trainingEngine.test.ts (created — 20 tests)
- src/hooks/useTrainingSession.ts (created — loads lesson, manages session)
- src/features/practice/Practice.tsx (rewired — move input, mode toggle, feedback, results)
- src/lib/repositories/curriculumRepo.ts (added getLesson, getLessons)

Tests Run:
- tsc -b (passed)
- eslint . (0 errors, 0 warnings)
- vite build (passed, /design-system tree-shaken from production JS)
- vitest run (68/68: 28 repo + 18 component + 1 curriculum seed + 20 training engine + 1 curriculum seed)
- docker compose up --build (HTTP 200 at /, /adventure, /practice/:lessonId)

Known Issues:
- Practice UI is text-input only; no chessboard component yet
- Mode can only be changed at session start (before first move)
- Training result is displayed but not persisted (TASK-006 will handle storage)
- No review scheduling integration yet

Next Recommended Task:
TASK-006-progression-engine.md

Notes:
Training engine is pure-function, deterministic, and fully unit-tested. Uses chess.js for
legal move validation. Guided mode wrong moves allow retry with no penalty. Instinct mode
wrong moves fail the run immediately. Auto-plays opponent moves from the seeded opening line.
Session result includes completed status, mistake count, perfect run flag, and move history.

Practice page at /practice/:lessonId loads seeded curriculum data through repositories
(no direct Dexie access), initializes a training session, accepts SAN move input, and
displays feedback and completion results.

---

## REVIEW-003 Handoff

Date:
2026-06-05

Agent:
cc Pi (Secondary Pi Agent)

Task:
REVIEW-003 - Design System Components Review

Branch:
main

Commit:
d739125

Files Changed:
- src/components/Modal.tsx (overlay click fix + aria-labelledby for accessibility)
- src/components/FeedbackBanner.tsx (visible-reset fix, onDismiss ref pattern, autoDismissMs null guard)
- src/components/LessonNode.tsx (always render button, remove invalid div disabled)
- src/components/ProgressBar.tsx (max=0 guard for NaN)
- src/components/__tests__/components.test.tsx (updated LessonNode test + new FeedbackBanner test)
- docs/HANDOFF.md (TASK-003 commit hash fix)
- docs/reviews/REVIEW-003-design-system-components.md (created)

Tests Run:
- tsc -b (passed)
- eslint . (passed)
- vitest run (47/47 passed, was 46/46)
- vite build (passed)

Known Issues:
- /design-system route and nav link ship in production with no DEV guard (see REVIEW-003 C-001)
- Modal with no title has no accessible name and no close button (see REVIEW-003 C-002)
- Feature placeholder pages use hand-rolled empty-state markup instead of EmptyState component (see REVIEW-003 C-003)

Next Recommended Task:
TASK-004-adventure-map.md (fix C-001 DEV guard early in that task)

Notes:
Fixed critical overlay-click bug in Modal (e.target check was wrong — backdrop click never fired).
Fixed FeedbackBanner silent-dismiss bug (banner stayed hidden after message change).
Fixed LessonNode invalid HTML (div disabled → button disabled).
Fixed ProgressBar NaN on max=0.
Fixed TASK-003 HANDOFF commit hash.

---

## TASK-003 Handoff

Date:
2026-06-04

Agent:
Windows Agent (cc DS)

Task:
TASK-003 - Design System Components

Branch:
main

Commit:
d29fad6

Files Changed:
- src/index.css (expanded @theme with radii, shadows, animations, color tokens)
- src/components/Button.tsx (created)
- src/components/Card.tsx (created)
- src/components/Modal.tsx (created)
- src/components/ProgressBar.tsx (created)
- src/components/Badge.tsx (created)
- src/components/XPChip.tsx (created)
- src/components/KeyChip.tsx (created)
- src/components/LessonNode.tsx (created)
- src/components/WorldCard.tsx (created)
- src/components/PageShell.tsx (created)
- src/components/EmptyState.tsx (created)
- src/components/FeedbackBanner.tsx (created)
- src/components/__tests__/components.test.tsx (created — 18 tests)
- src/features/design-system/DesignSystem.tsx (created)
- src/app/App.tsx (added /design-system route)
- src/components/AppShell.tsx (added DS nav link)
- vite.config.ts (no global environment change — per-file env directive)
- package.json (added jsdom, @testing-library/react, @testing-library/jest-dom)

Tests Run:
- tsc -b (passed)
- eslint . (passed)
- vite build (passed)
- vitest run (46/46 passed: 28 repo + 18 component)
- docker compose up --build (HTTP 200 at localhost:4317 and /design-system)

Known Issues:
- REVIEW-001 C-003 (docker-compose.yml anonymous volume) still applies
- REVIEW-002 C-001 (DEFAULT_USER_PROFILE frozen timestamp) not yet addressed
- Design system page at /design-system is dev-only — remove before launch

Next Recommended Task:
TASK-004-adventure-map.md

Notes:
All 12 components created with tablet-first sizing, accessible focus states, child-friendly styling.
Design tokens expanded with animation keyframes, radii, shadows, and extended color palette.
Component demo page at http://localhost:4317/design-system shows all components with variants.
Components are pure presentational — no business logic, no Dexie access, no training engine.

---

## REVIEW-002 Handoff

Date:
2026-06-04

Agent:
cc Pi (Secondary Pi Agent)

Task:
REVIEW-002 - Core Data Layer Review

Branch:
main

Commit:
aa2ef9f

Files Changed:
- src/lib/seed/seed.ts (achievement reset bug fix + transaction wrapping)
- src/lib/repositories/userProfileRepo.ts (throw on missing-record update)
- src/lib/repositories/lessonProgressRepo.ts (throw on missing-record update)
- src/lib/date.ts (UTC/local timezone fix for todayDateString and daysFromNow)
- src/lib/__tests__/repositories.test.ts (3 new tests + fixture fix)
- docs/HANDOFF.md (TASK-002 commit hash fix)
- docs/reviews/REVIEW-002-core-data-layer.md (created)

Tests Run:
- tsc -b (passed)
- eslint . (passed)
- vitest run (28/28 passed, was 25/25)

Known Issues:
- DEFAULT_USER_PROFILE.createdAt frozen at module import time (see REVIEW-002 C-001)
- trainingSessions and dailyQuests have no repos yet (see REVIEW-002 C-002)
- rewardsRepo unlocked-only queries are full scans (see REVIEW-002 C-003)

Next Recommended Task:
TASK-003-design-system-components.md

Notes:
Fixed critical achievement-unlock erasure bug (bulkPut → add-only with transaction).
Fixed silent no-op on update-missing-record in both profile and progress repos.
Fixed UTC/local date bug in todayDateString and daysFromNow.
Fixed test fixture inconsistency. Added 3 new regression tests.

---

## TASK-002 Handoff

Date:
2026-06-04

Agent:
Windows Agent

Task:
TASK-002 - Core Data Layer

Branch:
main

Commit:
c211e3f

Files Changed:
- tsconfig.json (project references fix per REVIEW-001 C-001)
- vite.config.ts (vitest config)
- docs/ARCHITECTURE.md (created stub)
- docs/TECHNICAL_STANDARDS.md (created stub)
- src/types/domain.ts (created — 12 domain types)
- src/lib/date.ts (created)
- src/lib/db.ts (created — 12 Dexie tables)
- src/lib/test-setup.ts (created — fake-indexeddb)
- src/lib/repositories/userProfileRepo.ts (created)
- src/lib/repositories/lessonProgressRepo.ts (created)
- src/lib/repositories/curriculumRepo.ts (created)
- src/lib/repositories/rewardsRepo.ts (created)
- src/lib/seed/defaults.ts (created)
- src/lib/seed/seed.ts (created)
- src/lib/__tests__/repositories.test.ts (created — 25 tests)

Tests Run:
- tsc -b (passed)
- eslint . (passed)
- vite build (passed)
- vitest run (25/25 passed)
- docker compose up --build (HTTP 200 at localhost:4317)

Known Issues:
- REVIEW-001 C-003 (docker-compose.yml anonymous volume) still applies

Next Recommended Task:
TASK-003-design-system-components.md

Notes:
Core data layer complete. All 12 domain types per DATA_MODEL.md plus TrainingSession, DailyQuest.
Four repository modules behind typed async functions — UI never touches IndexedDB directly.
Seed data includes default user profile, 4 achievements, classic skin and board theme.
Tests use fake-indexeddb for in-memory IndexedDB — no browser needed.

---

## REVIEW-001 Handoff

Date:
2026-06-04

Agent:
Secondary Pi Agent

Task:
REVIEW-001 - Project Bootstrap Review

Branch:
main

Commit:
4edc4b3

Files Changed:
- vite.config.ts (HMR clientPort, watch polling, orientation fix)
- docker-compose.yml (CHOKIDAR_USEPOLLING env var)
- docs/HANDOFF.md (commit hash fix)
- docs/PROJECT_STATE.md (Next Task fix)
- docs/reviews/REVIEW-001-project-bootstrap.md (created)
- public/icon-192.png (created placeholder)
- public/icon-512.png (created placeholder)
- src/hooks/.gitkeep (created)
- src/lib/.gitkeep (created)
- src/repositories/.gitkeep (created)
- src/services/.gitkeep (created)
- src/stores/.gitkeep (created)
- src/types/.gitkeep (created)
- src/assets/.gitkeep (created)

Tests Run:
- tsc -b (passed)
- eslint . (passed)
- docker compose build (pending)

Known Issues:
- tsconfig.json missing project references (see REVIEW-001 C-001)
- ARCHITECTURE.md and TECHNICAL_STANDARDS.md not yet created (see REVIEW-001 C-002)
- docker-compose.yml anonymous volume caveat (see REVIEW-001 C-003)
- PWA icons are placeholder only — replace before launch

Next Recommended Task:
TASK-002-core-data-layer.md

Notes:
Review pass applied 7 small fixes. 3 larger concerns documented in docs/reviews/REVIEW-001-project-bootstrap.md.

---

## TASK-001 Handoff

Date:
2026-06-04

Agent:
Windows Agent

Task:
TASK-001 - Project Bootstrap

Branch:
main

Commit:
24166b0

Files Changed:
- package.json
- tsconfig.json
- tsconfig.app.json
- tsconfig.node.json
- vite.config.ts
- eslint.config.ts
- .prettierrc
- .gitignore
- .dockerignore
- Dockerfile
- docker-compose.yml
- index.html
- public/vite.svg
- src/main.tsx
- src/index.css
- src/vite-env.d.ts
- src/app/App.tsx
- src/components/AppShell.tsx
- src/features/home/Home.tsx
- src/features/adventure/Adventure.tsx
- src/features/classic/Classic.tsx
- src/features/practice/Practice.tsx
- src/features/collection/Collection.tsx
- src/features/profile/Profile.tsx
- src/features/settings/Settings.tsx
- src/features/import-export/ImportExport.tsx

Tests Run:
- tsc -b (passed)
- vite build (passed)
- eslint . (passed)
- docker compose up --build (passed, HTTP 200 at localhost:4317)

Known Issues:
None.

Next Recommended Task:
TASK-002-core-data-layer.md

Notes:
Project foundation complete. React + Vite + TypeScript + TailwindCSS v4 + PWA + Docker Compose setup.
App runs at http://localhost:4317 via Docker Compose.
Placeholder routes for all 8 pages render correctly.
Core dependencies installed: zustand, chess.js, react-chessboard, dexie, react-router-dom.
ARCHITECTURE.md and TECHNICAL_STANDARDS.md not yet created.

---

## Initial Entry

Date:
2026-06-04

Agent:
Project Setup

Task:
Documentation Foundation

Branch:
main

Commit:
N/A

Files Changed:
- CLAUDE.md
- docs/*.md
- docs/tasks/*.md
- skills/*.md

Tests Run:
N/A

Known Issues:
No implementation started.

Next Recommended Task:
TASK-001-project-bootstrap.md

Notes:
Project is ready for implementation.
