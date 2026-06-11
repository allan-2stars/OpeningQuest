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

## TASK-018C Handoff

Date:
2026-06-11

Agent:
Windows Agent (cc DS)

Task:
TASK-018C — Coach Explanation Foundation

Branch:
main

Commit:
N/A (pending)

Files Changed:
- src/features/coach/types.ts (created — CoachCharacter, CoachMessage, CoachCharacterMeta)
- src/features/coach/coachService.ts (created — template-driven getCoachMessage, getCoachCharacter)
- src/features/coach/CoachPanel.tsx (created — coach message card with empty state)
- src/features/coach/CoachDemoPage.tsx (created — /coach-demo DEV-only interactive page)
- src/features/coach/__tests__/coachService.test.tsx (created — 17 tests)
- src/app/App.tsx (added /coach-demo DEV-guarded route)

Tests Run:
- tsc -b (passed)
- eslint . (0 errors, 0 warnings)
- vitest run (361/361 passed)

Coach system:
- Template-driven, no AI/LLM, no API calls
- Single coach character: 🐴 Sir Knight
- 10 template entries covering all classification+reason combinations
- Template lookup: specific (CLASSIFICATION_REASON) → generic (CLASSIFICATION) → DEFAULT

Templates:
  SMART_MOVE + OPENING_MOVE → "Great Job!" / "You stayed on the opening path."
  SMART_MOVE + BEST_MOVE → "Excellent!" / "You found the best move."
  GOOD_MOVE → "Nice Move!" / "Your position remains solid."
  SAFE_MOVE → "Safe Choice!" / "Nothing dangerous happened here."
  WATCH_OUT + OPENING_EXIT → "Watch Out!" / "You left the opening path here."
  WATCH_OUT + EVAL_DROP → "Careful!" / "This move made the position harder."
  OOPS → "Oops!" / "This move made the position much harder."
  DEFAULT → "Keep Going!" / "Every move is a chance to learn."

CoachPanel component:
- Renders coach card with avatar, character name, title, and message
- Empty state: "Choose a move to see coaching advice."
- Custom empty message supported via prop

CoachDemoPage (/coach-demo — DEV-only):
- Timeline on left, Coach panel on right (side-by-side on lg+)
- Click a move to update coach panel
- All 7 demo moves (e4, e5, Nf3, Nc6, Bc4, a4, Qh5) covering all classifications
- Selected move highlighted with ring
- No persistence, no Stockfish, no AI

Tests:
- All 8 template mappings verified
- Sir Knight character metadata
- CoachPanel empty state, custom empty message, normal rendering, OOPS message
- CoachDemoPage: page title, initial empty coach, e4 click → coach update, Qh5 click → Oops

Known Issues:
- Template coverage incomplete for some classification+reason-pair combinations
  (fall through to generic or DEFAULT gracefully)
- No integration with real session review data yet
- No persistence — coach messages are rendered on-the-fly

Next Recommended Task:
TASK-013-boss-battles.md or TASK-018D (wire coach into real post-session review)

Notes:
This is a template-driven coach system. No AI, LLM, OpenAI, Claude, or voice.
The coachService is a pure function that maps classification+reasonCode to
friendly messages. Ready for integration into the post-session review flow.

---


Date:
2026-06-11

Agent:
Windows Agent (cc DS)

Task:
TASK-018B — Review Timeline UI (Demo)

Branch:
main

Commit:
N/A (pending)

Files Changed:
- src/features/reviewAnalysis/reviewLabels.ts (created — classification→icon+label, reason→label mappings)
- src/features/reviewAnalysis/ReviewTimeline.tsx (created — scrollable timeline component)
- src/features/reviewAnalysis/ReviewDemoPage.tsx (created — /review-demo DEV-only page)
- src/features/reviewAnalysis/__tests__/ReviewTimeline.test.tsx (created — 12 tests)
- src/app/App.tsx (added /review-demo DEV-guarded route)

Tests Run:
- tsc -b (passed)
- eslint . (0 errors, 0 warnings)
- vitest run (344/344 passed)

Label mappings:
  Classification → icon + label:
    SMART_MOVE → ⭐ Smart Move
    GOOD_MOVE  → 👍 Good Move
    SAFE_MOVE  → 🛡 Safe Move
    WATCH_OUT  → 👀 Watch Out
    OOPS       → ❌ Oops

  Reason codes → child-friendly labels:
    OPENING_MOVE    → "On the Opening Path"
    BEST_MOVE       → "Best Move Found"
    OPENING_EXIT    → "Left the Opening Line"
    EVAL_DROP       → "Position Became Harder"
    LARGE_EVAL_DROP → "Big Position Change"
    SOLID_MOVE      → "Safe and Sound"
    SAFE_MOVE       → "Safe Choice"

Components:
- ReviewTimeline — accepts ReviewedMoveViewModel[], renders stacked card list
  with icon, move SAN, classification, and reason. Empty state with custom messages.
- ReviewTimelineItem — single row: icon | move | classification · reason
- ReviewDemoPage — /review-demo (DEV-only) showing sample timeline + empty state

Tests: label mappings for all classifications/reasons, SMART_MOVE icon, OOPS icon,
reason label child-friendliness (no cp/centi/eval jargon), timeline empty state,
custom empty messages, move rendering with labels, all 5 classification types, and
review-demo page title and content.

Known Issues:
- No persistence — demo only, static sample data
- No integration with real session data (future TASK-018C)
- No touch-specific timeline layout — desktop-first, adequate on tablet

Next Recommended Task:
TASK-018C (wire real session data into timeline)

Notes:
Child-friendly labels throughout. No centipawns, depth, eval-swing, or engine
jargon in user-facing text. DEV-only route — not exposed in production navigation.
ReviewTimeline component is reusable — accepts any ReviewedMoveViewModel[].

---


Date:
2026-06-11

Agent:
Windows Agent (cc DS)

Task:
TASK-018A — Move Classification Foundation

Branch:
main

Commit:
N/A (pending)

Files Changed:
- src/features/reviewAnalysis/types.ts (created — MoveClassification, ClassifierInput, MoveClassificationResult, ReviewedMove)
- src/features/reviewAnalysis/moveClassifier.ts (created — classifyMove pure function, 7-rule chain)
- src/features/reviewAnalysis/__tests__/moveClassifier.test.ts (created — 20 tests)

Tests Run:
- tsc -b (passed)
- eslint . (0 errors, 0 warnings)
- vitest run (327/327 passed)
- docker compose up --build (pending)

Classification rules (first-match priority):
1. moveSan === expectedMoveSan → SMART_MOVE / OPENING_MOVE
2. moveSan === bestMoveSan → SMART_MOVE / BEST_MOVE
3. openingExitDetected → WATCH_OUT / OPENING_EXIT
4. evalDrop >= 150 → OOPS / LARGE_EVAL_DROP
5. evalDrop >= 50 → WATCH_OUT / EVAL_DROP
6. evalDrop < 30 → GOOD_MOVE / SOLID_MOVE
7. Fallback → SAFE_MOVE / SAFE_MOVE

Where evalDrop = |evaluationBefore - evaluationAfter| (centipawns)

Tests cover:
- Opening move detection (rule 1 priority)
- Best move detection (rule 2)
- Opening exit (rule 3 over eval drop)
- Large eval drop >= 150 (OOPS)
- Moderate eval drop >= 50 (WATCH_OUT)
- Good move < 30 drop (GOOD_MOVE)
- Fallback (SAFE_MOVE)
- Priority chain: Rule 1 > Rule 2, Rule 3 > Rule 4, Rule 1 > Rule 3 through double-classifier edge

Known Issues:
- No persistent review sessions — classification is per-call only
- No integration with TASK-017C opening exit (separate modules, combined at call site)

Next Recommended Task:
TASK-013-boss-battles.md or integration task combining 017A+017C+018A into AI Review UI

Notes:
Pure classification layer only. No UI changes. No DB changes. No Stockfish calls.
Ready for TASK-018B UI integration. The classifyMove function is designed to be
called with data from both the training engine (expectedMoveSan) and
the Stockfish analysis service (bestMoveSan, evaluationBefore/After).

---


Date:
2026-06-11

Agent:
Windows Agent (cc DS)

Task:
TASK-017C — Opening Exit Detection

Branch:
main

Commit:
N/A (pending)

Files Changed:
- src/features/openings/types.ts (created — OpeningLineStatus, OpeningSessionResult, OpeningExitStats)
- src/features/openings/openingLineTracker.ts (created — evaluateOpeningLine pure function)
- src/features/openings/openingSessionRepo.ts (created — saveOpeningSessionResult, getOpeningExitStats, getRecentSessionResults, buildSessionResult)
- src/features/openings/__tests__/openingLineTracker.test.ts (created — 14 tests)
- src/lib/db.ts (v3 schema — added openingSessionResults table)
- src/services/processTrainingResult.ts (wired opening exit tracking on session completion)

Tests Run:
- tsc -b (passed)
- eslint . (0 errors, 0 warnings)
- vitest run (307/307 passed)
- docker compose up --build (Docker build pending — should serve on port 4317)

Architecture:
  Training Session Result (processTrainingResult)
  ↓
  extract user moves from result.history
  ↓
  evaluateOpeningLine(lessonId, expectedMoves, playedMoves)
  ↓
  OpeningLineStatus { inLine, exited, exitPly, exitMoveSan, expectedMoveSan }
  ↓
  buildSessionResult(session data) → saveOpeningSessionResult()
  ↓
  openingSessionResults table (Dexie v3)

Tracker (`evaluateOpeningLine`):
- Pure function — no side effects, no engine, no UI
- Compares playedMoves against expectedMoves move-by-move
- Detects exit at first deviation
- Returns 1-indexed exitPly, exitMoveSan, expectedMoveSan
- Empty played sequence = inLine=true (hasn't deviated yet)

Session repo (`openingSessionRepo`):
- `buildSessionResult()` — constructs the record from tracker output
- `saveOpeningSessionResult()` — persists to Dexie
- `getOpeningExitStats()` — returns { totalSessions, completedInLine, exitedEarly }
- `getRecentSessionResults(limit)` — latest 20, newest first
- All best-effort — failures don't block progression

Integration:
- Wired into `processTrainingResult` (existing progression pipeline)
- Only fires on completed or instinct-failed sessions
- Extracts user's accepted moves from `result.history`
- Loads expected line from curriculum via `getLesson` + `getOpeningLine`
- Best-effort try/catch — tracker failure must not block progression persistence

Known Issues:
- Exit detection only records the first deviation; multiple exits within a single guided session are not tracked per-attempt
- No UI for exit stats yet (infrastructure only)

Next Recommended Task:
TASK-018 (AI review / exit visualization) or TASK-013-boss-battles.md

Notes:
No visible UI changes. No Stockfish usage. No AI. The openingSessionResults table
is ready for TASK-018 analytics/visualization integration.

---


Date:
2026-06-10

Agent:
Windows Agent (cc DS)

Task:
TASK-017B — Analysis Debug Screen

Branch:
main

Commit:
N/A (pending)

Files Changed:
- src/features/analysis/AnalysisPage.tsx (created — developer-facing analysis debug page)
- src/features/analysis/__tests__/AnalysisPage.test.tsx (created — 14 tests)
- src/app/App.tsx (added /analysis route, DEV-guarded)
- src/components/AppShell.tsx (added Analysis nav link, DEV-guarded)

Tests Run:
- tsc -b (passed)
- eslint . (0 errors, 0 warnings)
- vitest run (293/293 passed)
- docker compose up --build (Vite ready, /analysis serves React app)

Analysis Debug Page (/analysis — DEV-only):
- Engine lifecycle controls: Start Engine / Stop Engine buttons
- FEN input textarea with Load Starting Position and Clear buttons
- Analyse button initiates Stockfish analysis
- Analysis Output card showing: Status, Depth, Evaluation (centipawns),
  Best Move, and Principal Variation (PV)
- Engine status badge: Not Started / Starting... / Ready / Analysing... / Error / Stopped
- Worker running indicator
- Loading state: textarea changes disable, button shows "Analysing..."
- Error handling: invalid FEN, engine timeout, worker failure
- Empty state prompt before any analysis

Tests (all mocked — no Stockfish execution):
- Page title, engine controls, position controls render
- Load Starting Position fills FEN textarea
- Clear empties textarea
- Start Engine transitions to Ready status
- Stdin shows empty state prompt
- Analysis result displays bestMove, evaluation, depth, PV
- Error messages display on engine failure
- Analysing state shows multiple indicators
- Stop Engine transitions to Stopped status
- Bad FEN error banner displays

Known Issues:
- Stockfish WASM (~3MB) loaded from node_modules — may need CDN for PWA
- No keyboard shortcuts for Analyse
- No FEN history

Next Recommended Task:
TASK-013-boss-battles.md

---


Date:
2026-06-10

Agent:
Windows Agent (cc DS)

Task:
TASK-017A — Stockfish Analysis Foundation

Branch:
main

Commit:
N/A (pending)

Files Changed:
- src/features/analysis/types.ts (created — AnalysisResult, AnalysisError, AnalysisStatus)
- src/features/analysis/stockfishWorker.ts (created — Web Worker with UCI protocol bridge)
- src/features/analysis/stockfish.js.d.ts (created — type declarations for stockfish.js)
- src/features/analysis/analysisService.ts (created — AnalysisService class with worker lifecycle)
- src/features/analysis/__tests__/analysisService.test.ts (created — 19 tests)
- package.json (added stockfish.js@10.0.2)

Tests Run:
- tsc -b (passed)
- eslint . (0 errors, 0 warnings)
- vitest run (279/279 passed)
- docker compose up --build (Vite ready on 0.0.0.0:5173, Docker serves on port 4317)

Architecture:
  UI (future)
  ↓
  AnalysisService (analysisService.ts)
  ↓
  Web Worker (stockfishWorker.ts)
  ↓
  Stockfish WASM (stockfish.js@10.0.2)

AnalysisService:
- Singleton instance (analysisService) — single engine reused across calls
- startEngine() — creates Worker, initializes Stockfish via UCI, resolves on "uciok"
- analysePosition(fen, depth) → AnalysisResult { bestMove, evaluation, depth, pv }
- getBestMove(fen) → string
- getEvaluation(fen) → number (centipawns)
- stopEngine() / terminateWorker() — clean worker teardown
- FEN validation before engine start (avoids unnecessary worker creation)
- Timeouts: 15s for engine init, 30s for move analysis

Web Worker (stockfishWorker.ts):
- Bundled by Vite as separate chunk
- UCI protocol bridge: init → uci → ready → position fen → go depth N → bestmove
- Handles ucinewgame for clean position reset between requests
- stop/quit commands for cancellation and teardown

Known Issues:
- Stockfish worker not yet wired into any UI (infrastructure only)
- No evaluation-to-human-readable conversion (centipawns only)
- Worker startup is lazy — first analysis call triggers engine load (~1-3s cold start)
- No FEN cache — repeated identical positions re-analyse

Next Recommended Task:
TASK-011-daily-quests.md or TASK-013-boss-battles.md

Notes:
This is infrastructure only — no UI changes. The analysisService singleton is ready
for future UI integration (hint buttons, move evaluation overlays, post-game analysis).
Worker is a Vite-bundled ES module worker; stockfish.js WASM is ~3MB gzipped.

---

## TASK-016 Handoff

Date:
2026-06-10

Agent:
Windows Agent (cc DS)

Task:
TASK-016 — Skin Visual Integration

Branch:
main

Commit:
N/A (pending)

Files Changed:
- src/lib/seed/defaults.ts (added 2 skins + 3 themes; per-ID delta arrays)
- src/lib/seed/seed.ts (per-ID seeding for skins/themes matching achievement pattern)
- src/hooks/useBoardCosmetics.ts (created — reads selected theme/skin from localStorage, loads from DB, returns square colors + piece tint)
- src/features/practice/pieceRenderer.tsx (created — SVG Unicode tinted piece renderer for react-chessboard customPieces)
- src/features/practice/Practice.tsx (wired useBoardCosmetics and buildCustomPieces into Chessboard)
- src/features/collection/__tests__/Collection.test.tsx (updated for new seed skins/themes)

Seeded cosmetics:
- 3 piece skins: Classic (unlocked), Ocean Blue (unlocked), Royal Gold (locked)
- 4 board themes: Classic (unlocked), Dark Wood (unlocked), Midnight (locked), Royal (locked)
- All use per-ID delta seeding — existing installations pick up new rows

Board theme integration:
- Practice board square colours driven by selected theme from localStorage
- Dark Wood theme visible immediately when equipped in Collection
- Fallback to classic wood if no theme selected or theme not found

Piece skin integration:
- Tinted Unicode chess piece rendering via react-chessboard customPieces
- Blue and Gold tints applied to piece characters
- Classic skin uses native-rendered pieces (no customPieces — standard appearance)
- Unknown skin IDs fall back to classic

Collection updates:
- CosmeticCard and BoardThemeCard display seeded skins/themes
- Active badge for equipped item
- Locked badge for locked items with disabled button
- Dark Wood theme shows warm brown colour swatch

Tests Run:
- tsc -b (passed)
- eslint . (0 errors, 0 warnings)
- vitest run (259/259 passed)
- docker compose up --build (Docker serves on port 5173)

Known Issues:
- Custom piece rendering uses Unicode characters (♙♘♗♖♕♔♟♞♝♜♛♚) — not pixel-perfect SVG
- No image assets for custom skins — purely colour-tinted via text rendering
- Premove highlight styles remain red regardless of theme (intentional — they signal intent)

Next Recommended Task:
TASK-013-boss-battles.md

Notes:
The useBoardCosmetics hook handles the full load-select-fallback chain: read localStorage →
query Dexie → extract colours → provide ready-to-use CSSProperties. The Practice page
simply spreads cosmetics.darkSquareStyle and cosmetics.lightSquareStyle into
react-chessboard props. Custom pieces only activate when pieceTint is non-undefined.

---

## TASK-015 Handoff

Date:
2026-06-10

Agent:
Windows Agent (cc DS)

Task:
TASK-015 — Responsive Polish

Branch:
main

Commit:
N/A (pending)

Files Changed:
- src/components/AppShell.tsx (responsive header: overflow-x-auto, smaller padding/gaps on mobile, shrink-0 nav)
- src/features/practice/Practice.tsx (sidebar width lg:w-72→80, consistent gap spacing)
- src/features/statistics/Statistics.tsx (responsive grid gaps, sm:grid-cols-4 for summary cards)

Tests Run:
- tsc -b (passed)
- eslint . (0 errors, 0 warnings)
- vitest run (259/259 passed)
- docker compose up --build (Docker serves HTML, Vite ready on 0.0.0.0:5173)

Responsive fixes applied:

AppShell (mobile/tablet header):
- overflow-x-auto for horizontal scrolling nav on narrow screens
- Smaller padding (px-4 py-2) and text (text-lg→sm:text-xl) on mobile
- Nav items use px-2 sm:px-3, text-xs sm:text-sm, whitespace-nowrap
- Main content padding: p-3 sm:p-4 lg:p-6

Practice page:
- Sidebar width: lg:w-80 (was 72) for better content display
- Board already responsive via boardWidth calculation (Math.min(560, window.innerWidth - 48))
- Side-by-side layout on lg+, stacked on smaller screens

Statistics page:
- Summary cards: gap-2 sm:gap-3
- Progress grid: gap-3 sm:gap-4

Known Issues:
- PGN Import/Export page not yet optimized for narrow screens
- Adventure map node spacing remains desktop-first (functional at all widths)
- No responsive image optimization for piece previews in Collection

Next Recommended Task:
TASK-014-classic-mode.md or further polish tasks

Notes:
This pass focused on the three most-used pages: Practice, Adventure, and Statistics.
AppShell header now scrolls horizontally on narrow screens instead of wrapping.
No design system changes — all fixes use existing Tailwind utilities.

---

## TASK-014 Handoff

Date:
2026-06-10

Agent:
Windows Agent (cc DS)

Task:
TASK-014 — Statistics Dashboard MVP

Branch:
main

Commit:
N/A (pending)

Files Changed:
- src/features/statistics/statisticsService.ts (created — getDashboardStats, getWorldProgress, getRecentActivity)
- src/features/statistics/Statistics.tsx (created — full dashboard UI)
- src/features/statistics/__tests__/statisticsService.test.ts (created — 12 tests)
- src/app/App.tsx (added /statistics route)
- src/components/AppShell.tsx (added Statistics nav entry)

Tests Run:
- tsc -b (passed)
- eslint . (0 errors, 0 warnings)
- vitest run (250/250 passed)
- docker compose up --build (Vite ready, port 5173 correct)

Dashboard:
- Summary cards: Total XP, Keys, Lessons Completed, Reviews
- Progress section: Lessons (bar), Worlds (bar), Average Mastery (bar), Due Reviews
- World breakdown: per-world completion % bar + avg mastery
- Daily Quests summary: X/3 completed, link to Adventure
- Recent activity: latest 20 items with type badges and relative timestamps
- Empty state: "Welcome to Opening Quest" for new users
- Info banner for new users on first visit

Statistics service:
- getDashboardStats() — aggregates all lesson progress, world completion, daily quests
- getWorldProgress() — per-world completion %, mastery average
- getRecentActivity() — derived from progress, quests, achievements (no event log needed)
- All read-only — no data modification
- Handles empty user state gracefully (zeroed stats, not crashes)

Known Issues:
- reviewsCompleted is approximate (counts lessons with attempts, not dedicated review sessions)
- Recent activity derived from existing data rather than a dedicated event log
- Statistics page refreshes on mount only — no auto-refresh

Next Recommended Task:
TASK-015-polish-and-pwa-release.md

Notes:
Statistics dashboard is read-only and UI-independent. All data flows through repository/service
layers. No component accesses Dexie directly.

---

## TASK-013 Handoff

Date:
2026-06-10

Agent:
Windows Agent (cc DS)

Task:
TASK-013 — Daily Quests MVP

Branch:
main

Commit:
N/A (pending)

Files Changed:
- src/types/domain.ts (added DailyQuestProgress + DailyQuestBonus types)
- src/lib/db.ts (added dailyQuestProgress + dailyQuestBonus tables, version 2 schema)
- src/features/quests/dailyQuestDefinitions.ts (created — 3 quest definitions)
- src/features/quests/dailyQuestRepo.ts (created — getTodayQuests, getTodayBonus, upsert)
- src/features/quests/dailyQuestService.ts (created — ensureTodayQuests, recordQuestEvent, claimQuestReward, claimAllQuestRewards)
- src/features/quests/__tests__/dailyQuestService.test.ts (created — 17 tests)
- src/features/adventure/Adventure.tsx (added Daily Quests card with claim buttons)
- src/services/processTrainingResult.ts (wired daily quest event recording)

Tests Run:
- tsc -b (passed)
- eslint . (0 errors, 0 warnings)
- vite build (passed)
- vitest run (238/238 passed)
- docker compose up --build (HTTP 200 at /, /adventure, /practice/:lessonId)

Daily Quests:
- 3 fixed daily quests: Complete 1 review, Practice 1 new lesson, Earn 50 XP
- each completed quest grants +25 XP on claim
- all 3 completed + claimed → +1 key bonus (once per day)
- quest progress capped at target, duplicate events not over-completed
- quest reward XP excluded from earn_xp_50 (source: "quest_reward" guard)
- events recorded from processTrainingResult (review_completed, new_lesson_practiced, xp_earned)
- UI card on Adventure page with progress bars, claim buttons, all-complete bonus

Known Issues:
- Quest rewards could be double-claimed if user taps Claim twice quickly before DB write
- No quest reset mechanism — stale quests from previous days cleaned up lazily

Next Recommended Task:
TASK-014-classic-mode.md

Notes:
Quest system uses local YYYY-MM-DD date for daily reset matching user device timezone.
All quest persistence through dedicated repo (dailyQuestRepo.ts). Events fire from
processTrainingResult — no UI component accesses Dexie directly.

---

## TASK-012 Handoff

Date:
2026-06-10

Agent:
cc Pi (Secondary Pi Agent)

Task:
TASK-012 — Review Queue MVP

Branch:
main

Commit:
(this commit)

Files Changed:
- src/features/review/reviewSchedule.ts (created — calculateNextReviewDate)
- src/features/review/reviewService.ts (created — getDueLessons, getReviewQueue, ReviewQueueItem)
- src/features/review/ReviewComplete.tsx (created — completion screen)
- src/features/review/__tests__/reviewSchedule.test.ts (created — 8 tests)
- src/features/review/__tests__/reviewService.test.ts (created — 6 tests)
- src/stores/reviewSessionStore.ts (created — Zustand store: queue, currentIndex, totalXpEarned)
- src/types/domain.ts (added "review" to PracticeMode)
- src/services/processTrainingResult.ts (review mode → applyReviewResult + XP_REVIEW_SUCCESS bonus)
- src/app/App.tsx (added /review/complete route)
- src/features/adventure/Adventure.tsx (added Today's Training card with review count and Start Review button)
- src/features/practice/Practice.tsx (review session banner, Next Review / Finish Review / Skip to Next buttons)
- docs/PROJECT_STATE.md (updated status)

Tests Run:
- tsc --noEmit (passed)
- eslint src (0 errors, 0 warnings)
- vite build (passed)
- vitest run (221/221 passed — 17 new tests)

Review Queue MVP:
- calculateNextReviewDate: mastery level 0–3 → 1/3/7/14 days, level 4+ → 30 days
- getDueLessons/getReviewQueue: returns LessonProgress where masteryLevel>=4 and nextReviewAt<=now, oldest-due-first
- reviewSessionStore: Zustand store holding queue, currentIndex, totalXpEarned, isActive
- Adventure page: "Today's Training" card shows Review Due count, new lessons count, estimated time, "Start Review" button
- Practice page: review session banner showing "Review Session | X of Y"; review-specific action buttons after completion
- ReviewComplete page at /review/complete: shows lessons reviewed and XP earned
- Review mode in processTrainingResult: calls applyReviewResult (schedules next review interval on success, applies mastery decay on 2 failed reviews) + adds XP_REVIEW_SUCCESS (50 XP) bonus on completion
- PracticeMode type extended to "guided" | "instinct" | "review"

Known Issues:
- Review session state lives in Zustand (in-memory only). If the user refreshes mid-review, the session is lost and they return to Adventure. The queue can be reloaded and restarted.
- "Skip to Next" on a failed review lesson advances the queue without marking the lesson as reviewed — applyReviewResult records a failed review attempt but the interval does not advance.

Next Recommended Task:
TASK-013-boss-battle.md

---

## INVESTIGATION-002 — Practice Page Blank Screen Fix

Date:
2026-06-10

Agent:
Windows Agent (cc DS)

Task:
INVESTIGATION-002 — Practice Page Blank Screen Bug Fix (react-chessboard React 19 defaultProps)

Branch:
main

Commit:
N/A (pending)

Files Changed:
- src/features/practice/Practice.tsx (pass all 11 function-valued + 1 object-valued props react-chessboard expects via defaultProps)
- src/features/practice/__tests__/Practice.test.tsx (created — 3 integration tests)
- docs/investigations/INVESTIGATION-002-practice-page-blank-screen.md (created + updated)

Root Cause:
React 19 ignores all defaultProps on function components. react-chessboard 1.3.1 defines
12 defaultProps (11 functions + 1 object) that its internal render and effect hooks call
unconditionally. When ANY of these is undefined due to defaultProps not being applied,
the corresponding call — isDraggablePiece(piece), onArrowsChange(arrows),
getPositionObject(pos), etc. — throws TypeError during render, unmounting the entire
React tree and leaving only a blank screen.

The first fix covered 2 of 12 defaults. The complete fix passes all 12 explicitly.

Fix:
All 12 react-chessboard defaultProps are now passed explicitly:
  isDraggablePiece, getPositionObject, onArrowsChange, onDragOverSquare,
  onMouseOutSquare, onMouseOverSquare, onPieceClick, onPieceDragBegin,
  onPieceDragEnd, onSquareClick, onSquareRightClick, customDropSquareStyle.
Also guards boardWidth with Math.max(200, ...) belt-and-suspenders.

Tests Run:
- tsc -b (passed)
- eslint . (0 errors, 0 warnings)
- vite build (passed)
- vitest run (207/207 passed)
- docker compose up --build (HTTP 200 at /, /adventure, /practice/:lessonId)

Known Issues:
- react-chessboard 1.3.1 has full defaultProps incompatibility with React 19. Any
  future use of <Chessboard> must pass ALL function-valued defaultProps explicitly.
- No ErrorBoundary in the app — any render-phase crash unmounts the entire tree.

Next Recommended Task:
TASK-012-review-system.md

Notes:
See docs/investigations/INVESTIGATION-002 for full investigation chain, reproduction
steps, crash traces, and the complete table of 12 affected defaultProps.

---

## REVIEW-011 Handoff

Date:
2026-06-08

Agent:
cc Pi (Secondary Pi Agent)

Task:
REVIEW-011 — Chessboard Practice UX Review

Branch:
main

Commit:
(this commit)

Files Changed:
- src/hooks/useTrainingSession.ts (F-001: expose expectedSan for correct highlight colour)
- src/features/practice/Practice.tsx (F-001: use expectedSan; F-002: remove void _piece; F-003: remove submitMove wrapper)
- docs/reviews/REVIEW-011-chess-board-experience.md (created)
- docs/HANDOFF.md (this entry)

Tests Run:
- tsc --noEmit (passed)
- eslint src (0 errors, 0 warnings)
- vitest run (204/204 passed)

Known Issues:
- C-001: Pawn promotion always defaults to queen — no promotion picker. Not triggered by any seed opening lines (depth 3–6). Defer to future task if long imported lines are added.
- C-002: boardWidth is computed once at render time; board won't resize on tablet rotation without a ResizeObserver. Acceptable for V1.

Next Recommended Task:
TASK-012-review-system.md

Notes:
F-001 is the primary correctness fix: legal-but-wrong moves were showing gold highlights
(same as correct moves) because highlights were set before the training engine evaluated
the move. Fixed by exposing expectedSan from useTrainingSession so onPieceDrop can
determine the correct colour before submitting. Wrong legal moves now show red.

---

## TASK-011 Handoff

Date:
2026-06-08

Agent:
Windows Agent (cc DS)

Task:
TASK-011 — Chessboard Practice UX

Branch:
main

Commit:
N/A (pending)

Files Changed:
- src/features/practice/Practice.tsx (rewritten — chessboard-driven UX with react-chessboard)

Tests Run:
- tsc -b (passed)
- eslint . (0 errors, 0 warnings)
- vite build (passed)
- vitest run (204/204 passed)
- docker compose up --build (HTTP 200 at /, /adventure, /collection, /practice/:lessonId)

Chessboard UX:
- Interactive drag-and-drop chessboard centered in the practice page
- Board auto-orientation: White at bottom for White lessons, Black at bottom for Black lessons
- Flip Board button to toggle orientation
- Pieces draggable during active session; disabled on session complete/failure
- onPieceDrop converts from/to → SAN via chess.js, submits to training engine
- Position controlled by training engine FEN — engine is the single source of truth
- Illegal moves: red highlight on source square, piece returns
- Correct moves: gold highlight on source/target, engine processes move, board auto-updates
- Opponent auto-play moves reflected via FEN change from engine
- Coordinates shown (a-h, 1-8)
- Classic wood-coloured board (matches seed BoardTheme)

Sidebar:
- Mode selector (Guided/Instinct) — same behavior as before
- Progress counter: user move count (userMoveCount, not all plies)
- Text input fallback: collapsed by default, toggleable for debug
- Feedback banner for correct/wrong/illegal moves
- Session result card with completion, mistakes, perfect run, progress
- Reward summary card (XP, keys, achievements)
- Restart + Switch Mode buttons on session end

Layout:
- Tablet-first: board on top, sidebar on right (horizontal on lg+)
- Board max width 560px, responsive
- Sidebar width 288px on desktop, full width on mobile

Known Issues:
- REVIEW-008 C-001/C-002 (seed upgrade) still tracked

Next Recommended Task:
TASK-012-review-system.md (or the daily quests task from the task file)

Notes:
Primary UX is now board-based drag-and-drop. Training engine unchanged — all existing
tests pass without modification. react-chessboard handles rendering; chess.js handles
validation and SAN conversion. The engine's FEN prop drives board position — onPieceDrop
always returns false so the board never manages its own internal position.

---

## INVESTIGATION-001 — Seed Data Wiring Fix

Date:
2026-06-08

Agent:
Windows Agent (cc DS)

Task:
INVESTIGATION-001 — Seed Data Not Visible in UI

Branch:
main

Commit:
N/A (pending)

Files Changed:
- src/main.tsx (call seedCoreData() at app startup before render)
- docs/investigations/INVESTIGATION-001-seed-data-wiring.md (created)

Root Cause:
seedCoreData() was never called at application startup. The seed function existed and was
fully tested (204 tests), but src/main.tsx did not import or invoke it. The app booted with
an empty IndexedDB — no worlds, lessons, lines, profiles, achievements, piece skins,
or board themes were ever inserted at runtime.

Fix:
Added an async boot() function in main.tsx that calls await seedCoreData() before
createRoot(...).render(...). seedCoreData is idempotent (all guards: count===0,
if (!existing)) — on subsequent app loads it returns instantly. Wrapped in try/catch
so seed failure is non-fatal (empty states shown instead of app crash).

Tests Run:
- tsc -b (passed)
- eslint . (0 errors, 0 warnings)
- vite build (passed)
- vitest run (204/204 passed)
- docker compose up --build (HTTP 200 at /, /adventure, /collection)

Known Issues:
- Review reports (REVIEW-008, REVIEW-010) did not catch this because they verify code
  correctness at the repository/seed level but did not test full app bootstrap flow
- No end-to-end test verifies the seed→UI pipeline exists

Next Recommended Task:
TASK-011-daily-quests.md

Notes:
Seed data now populates automatically on first app load. Subsequent loads skip seeding
because all tables are non-empty. The INVESTIGATION-001 document in docs/investigations/
contains full evidence and chain-of-custody trace.

---

## REVIEW-010A Handoff

Date:
2026-06-08

Agent:
cc Pi (Secondary Pi Agent)

Task:
REVIEW-010A — Seed Data Wiring Review

Branch:
main

Commit:
(this commit)

Files Changed:
- docs/reviews/REVIEW-010A-seed-data-wiring.md (created)
- docs/HANDOFF.md (this entry)

Tests Run:
- tsc --noEmit (passed)
- eslint src/main.tsx (0 errors)
- vitest run (204/204 passed)

Known Issues:
- C-001: boot() called without .catch() — unhandled rejection if createRoot/render throws (near-impossible in practice; non-fatal in all realistic failure modes).
- C-002: No integration test for the seed→UI pipeline. All tests call seedCoreData() explicitly in setup, so the production entry point was never exercised. E2E coverage would have caught this immediately.

Next Recommended Task:
TASK-011-daily-quests.md

Notes:
Root cause correctly identified. Fix is minimal and correct: seedCoreData() called in
an async boot() in main.tsx before the first React render. The function is idempotent —
subsequent app loads complete the seed guards instantly. No architecture violations: no
UI component accesses Dexie directly. All 204 tests pass.

---

## REVIEW-010 Handoff

Date:
2026-06-08

Agent:
cc Pi (Secondary Pi Agent)

Task:
REVIEW-010 — Collection System Review

Branch:
main

Commit:
(this commit)

Files Changed:
- src/features/collection/__tests__/Collection.test.tsx (F-001: vi.stubGlobal localStorage mock — all 7 tests were failing)
- src/hooks/useCollection.ts (F-002: writeSelected on default selection; F-003: consolidated rewardsRepo imports)
- docs/reviews/REVIEW-010-collection-system.md (created)
- docs/HANDOFF.md (this entry)

Tests Run:
- tsc --noEmit (passed)
- eslint src (0 errors, 0 warnings)
- vitest run (204/204 passed)

Known Issues:
- C-001: localStorage skin/theme selection is not included in JSON backup/restore (TASK-009). After a restore, the hook auto-selects the first unlocked item — correct default, but may differ from user's explicit choice. Acceptable for V1.
- C-002: CosmeticCard and BoardThemeCard are near-identical components. No shared abstraction yet. Acceptable for V1; generalise when a third cosmetic category is added.

Next Recommended Task:
TASK-011-daily-quests.md

Notes:
F-001 is the critical fix: all 7 Collection tests failed with "localStorage.clear is not a function"
because Vitest 4.1.8's jsdom environment exposes a localStorage stub without standard Storage API
methods. Fixed by injecting a full in-memory mock via vi.stubGlobal in beforeEach.
F-002: useCollection auto-selected the first unlocked skin/theme on first visit but never wrote
the selection to localStorage, so any future reader of oq_selected_skin_id would get null.
F-003: two import lines from the same module consolidated to one.

---

## TASK-010 Handoff

Date:
2026-06-08

Agent:
Windows Agent (cc DS)

Task:
TASK-010 - Collection System

Branch:
main

Commit:
N/A (pending)

Files Changed:
- src/hooks/useCollection.ts (created — loads skins/themes from rewardsRepo, localStorage selection persistence)
- src/features/collection/Collection.tsx (rewritten — piece skin grid + board theme grid)
- src/features/collection/__tests__/Collection.test.tsx (created — 7 tests)

Tests Run:
- tsc -b (passed)
- eslint . (0 errors, 0 warnings)
- vite build (passed)
- vitest run (204/204 passed)
- docker compose up --build (HTTP 200 at /, /collection)

Collection page:
- Piece skins grid: shows name, pieceType, locked/unlocked/selected state
- Board themes grid: shows name, description, light/dark colour swatches, locked/unlocked/selected state
- Locked items shown as disabled buttons with 🔒 icon and "Locked" badge
- Unlocked items show ♞ icon, clickable, with hover/focus styles
- Selected item shows "Active" badge, highlighted border, selection ring
- Selection persisted to localStorage
- Loading spinner, error banner, and empty states covered
- No direct Dexie access — all data loaded through rewardsRepo

Tests:
- Renders skins/themes from seed data
- Loading spinner visible initially
- Active tag shown on default unlocked items
- Can select a different unlocked skin (Golden → Active)
- Locked skin has disabled button
- Locked theme has disabled button

Known Issues:
- REVIEW-008 C-001/C-002 (seed upgrade) still applies
- No additional cosmestics beyond seed data defaults
- Selection persisted via localStorage (not IndexedDB) — adequate for V1

Next Recommended Task:
TASK-011-daily-quests.md

Notes:
Collection system follows tablet-first, child-friendly design. Locked items are
visible but disabled with clear 🔒 icon. Active selection persists across page
navigation via localStorage. No shop/payments/social features.

---

## REVIEW-009 Handoff

Date:
2026-06-08

Agent:
cc Pi (Secondary Pi Agent)

Task:
REVIEW-009 — PGN Import/Export Review

Branch:
main

Commit:
d5ece97

Files Changed:
- src/features/import-export/ImportExport.tsx (F-001: useEffect init; F-004: consolidate pgnService imports)
- src/lib/repositories/customOpeningRepo.ts (F-002: correct depth formula; F-003: Dexie transaction)
- src/services/backupService.ts (F-005: Dexie transaction wrapping importBackup restore)
- docs/reviews/REVIEW-009-pgn-import-export.md (created)
- docs/HANDOFF.md (this entry)

Tests Run:
- tsc --noEmit (passed)
- eslint src (0 errors, 0 warnings)
- vitest run (197/197 passed)

Known Issues:
- C-001: importBackup clears all tables including any future tables not in the backup format. Importing an old backup after a schema addition will silently wipe the new table. Documented in review file.
- C-002: isValidBackupShape validates only 4 of the 14 BackupData fields. A backup with corrupt pieceSkins/variations/lessons arrays passes shape validation. Documented in review file.
- C-003: Imported lessons have no LessonProgress row. Practice flow uses makeStubProgress fallback — functional but inconsistent with seeded lessons.

Next Recommended Task:
TASK-010-collection-system.md

Notes:
F-001: loadLines() was called directly in the render body without useEffect, causing
multiple concurrent getImportedLines() calls on each parent re-render while the async
fetch was in-flight. Fixed with a cancellable useEffect fetch.
F-002: addImportedOpening set depth=line.sanMoves.length (total moves) instead of the
user-facing move count. Same error as REVIEW-008's Black-side depth fix. Corrected to
ceil(N/2) for White and floor(N/2) for Black.
F-003: addImportedOpening's 4 sequential put()s could leave orphaned records on quota
failure. Wrapped in db.transaction().
F-005: importBackup's clear()+bulkPut() sequence had no transaction; a bulkPut failure
left DB partially empty. Wrapped in db.transaction("rw", db.tables, ...) for atomic rollback.

---

## TASK-009 Handoff

Date:
2026-06-08

Agent:
Windows Agent (cc DS)

Task:
TASK-009 - PGN Import/Export and JSON Backup/Restore

Branch:
main

Commit:
N/A (pending)

Files Changed:
- src/services/pgnService.ts (created — parsePgn, exportPgn)
- src/services/backupService.ts (created — exportBackup, importBackup)
- src/services/__tests__/pgnBackup.test.ts (created — 21 tests)
- src/lib/repositories/customOpeningRepo.ts (created — putOpeningLine, addImportedOpening, getImportedLines)
- src/features/import-export/ImportExport.tsx (rewritten — PGN import/export, JSON backup/restore UI)

Tests Run:
- tsc -b (passed)
- eslint . (0 errors, 0 warnings)
- vite build (passed)
- vitest run (197/197 passed: 33 repo + 18 component + 31 training + 28 progression + 12 reward + 44 curriculum + 10 curriculum seed + 21 pgn/backup)
- docker compose up --build (HTTP 200 at /, /import-export)

PGN import:
- Paste PGN text with or without headers
- Validates all moves through chess.js (parse + replay)
- Extracts sanMoves, fenPositions, PGN
- Stores as OpeningLine with source: "imported" or "user"
- Creates supporting Lesson, Variation, OpeningFamily records for practice compatibility
- Side selector (white/black) for which colour the user plays
- Clear error messages for empty, invalid, or illegal PGN

PGN export:
- Export any imported/custom line to clipboard as PGN
- Standard headers: Event (opening name), Site, Date, Round, White, Black, Result *
- Exported PGN re-imports correctly (round-trip verified)

JSON backup:
- Exports all 12 tables + version metadata
- Download as .json file
- Restore: validates shape, version, required arrays
- Clears and replaces all data (full replace, not merge)
- Round-trip: export→wipe→restore preserves profile, progress, achievements

Known Issues:
- REVIEW-008 C-001/C-002 (seed upgrade path) still applies
- PGN import only supports standard chess — no variant support
- Backup restore is full replacement only (no merge choice UI)

Next Recommended Task:
TASK-010-collection-system.md

Notes:
All PGN parsing validated through chess.js. Imported openings create playable lessons
at /practice/:lessonId. Backup round-trip preserves user profile, all lesson progress,
achievements, and curriculum data. UI does not access Dexie directly — PGN/backup
services handle all data access.

---

## REVIEW-008 Handoff

Date:
2026-06-06

Agent:
cc Pi (Secondary Pi Agent)

Task:
REVIEW-008 — Opening Curriculum Review

Branch:
main

Commit:
daf9ce3

Files Changed:
- src/types/domain.ts (F-001: added `order: number` to World type)
- src/lib/seed/curriculum.ts (F-001: order 1/2/3 on worlds; F-002: corrected depth for 7 Black-side lessons)
- src/lib/repositories/curriculumRepo.ts (F-001: sort worlds by order in getAllWorlds)
- src/lib/__tests__/curriculum.test.ts (F-001: 2 new world-ordering tests)
- src/lib/__tests__/repositories.test.ts (F-001: added order:1 to World fixture)
- docs/reviews/REVIEW-008-opening-curriculum.md (created)
- docs/HANDOFF.md (this entry)

Tests Run:
- tsc --noEmit (passed)
- eslint src (0 errors, 0 warnings)
- vitest run (176/176 passed)

Known Issues:
- C-001: seedCurriculum uses table-level count===0 guards. Existing users who upgrade from World 1-2 to World 1-3 will not get progress rows seeded for World 3 lessons. Documented in review file.
- C-002: Future curriculum additions (World 4+) cannot be seeded incrementally without clearing all tables. Document in review file; recommend switching to per-ID upsert pattern (bulkPut) when TASK-011+ adds new worlds.

Next Recommended Task:
TASK-009-pgn-import-export.md

Notes:
F-001 fixes a critical bug: world IDs sort alphabetically as defender_fortress < knight_meadows < royal_castle,
causing World 3 to be always-unlocked and World 1 to require World 3 complete. The fix adds World.order
and sorts in getAllWorlds() — no db schema version bump needed (non-indexed field).
F-002 fixes metadata: Black-side lesson depth should equal floor(sanMoves.length/2) not ceil.
Affected: caro_main, caro_exchange, french_main, french_exchange, scan_main (4→3), scan_queen (5→4), boss_w3 (6→5).

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
