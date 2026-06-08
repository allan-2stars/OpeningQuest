# REVIEW-011 — Chessboard Practice UX

Reviewer: cc Pi (Secondary Pi Agent)
Date: 2026-06-08
Task reviewed: TASK-011 (react-chessboard drag-and-drop practice UX)

---

## Summary

TASK-011 replaces the text-only practice page with an interactive drag-and-drop
chessboard. Training logic unchanged. Three issues fixed inline; two concerns documented.

---

## Fixed Inline

### F-001 — Bug: Legal-but-wrong moves flash gold highlight

**File:** `src/features/practice/Practice.tsx`, `src/hooks/useTrainingSession.ts`

**Problem:** `onPieceDrop` called `setAttemptedSquares` (gold) unconditionally for all
legal moves, BEFORE calling `handleMove`. The training engine's verdict
(correct vs. wrong opening move) was not available at highlight time.

Result: a player drags a piece to a legal-but-wrong square → board flashes gold for
1200ms → feedback banner says "wrong" → piece snaps back. Contradictory feedback.

**Fix:**
- Added `expectedSan: string | null` to `useTrainingSession`'s return, computed as
  `sanMoves[state.currentMoveIndex] ?? null`.
- In `onPieceDrop`, compare `moveResult.san === expectedSan` before setting highlights:
  - Correct opening move → gold on source + target
  - Legal but wrong opening move → red on source only (same as illegal)

This keeps the highlight colour consistent with the feedback banner.

---

### F-002 — Cleanup: `void _piece;` is redundant

**File:** `src/features/practice/Practice.tsx`

`_piece` is already prefixed with `_`, which `@typescript-eslint/no-unused-vars`
(inherited from `tseslint.configs.recommended`) treats as intentionally unused. The
`void _piece;` statement inside the function body was dead code. Removed. The parameter
was also renamed from `_piece` to match the shorter signature since it's unused.

---

### F-003 — Cleanup: Trivial `submitMove` wrapper removed

**File:** `src/features/practice/Practice.tsx`

```ts
const submitMove = useCallback((san: string) => { handleMove(san); }, [handleMove]);
```

This 4-line `useCallback` did nothing but proxy to `handleMove`. Both call sites
(`onPieceDrop` and `handleTextSubmit`) now call `handleMove` directly.

---

## Larger Concerns

### C-001 — Promotion always defaults to queen; no promotion dialog

**File:** `src/features/practice/Practice.tsx`, line ~79

```ts
promotion: targetSquare[1] === "8" || targetSquare[1] === "1" ? "q" : undefined,
```

All pawn promotions auto-promote to queen. The user cannot choose rook, bishop, or
knight. For the seeded opening lines (depth 3–6 moves), promotions never occur, so this
is functionally invisible in V1.

Risk surfaces when: (a) a user imports a very long PGN line (TASK-009) that reaches
move 7+ and includes a promotion, or (b) a future task adds deeper curriculum.

The correct approach when this matters: detect the promotion case and show a simple piece
picker before calling `handleMove`. Defer to a future task; note in HANDOFF.

### C-002 — boardWidth computed once at render time; no resize listener

**File:** `src/features/practice/Practice.tsx`, Chessboard `boardWidth` prop

```ts
boardWidth={Math.min(560, typeof window !== "undefined" ? window.innerWidth - 48 : 480)}
```

The width is sampled from `window.innerWidth` at render time. If a tablet user rotates
from portrait to landscape (or vice versa), the board size won't adapt until a full page
navigation or refresh. On portrait→landscape, the board may appear too small; on
landscape→portrait, it may appear larger than the viewport.

Fix when it matters: add a `ResizeObserver` (or `window.resize` listener with cleanup)
to update a state variable on orientation change. Defer to a future task.

---

## Checklist

- [x] Practice page shows a real chessboard (react-chessboard, position=state.fen)
- [x] User can submit moves through board interaction (drag-and-drop via onPieceDrop)
- [x] Text input is no longer the primary UX (collapsed behind toggle by default)
- [x] Correct moves advance the lesson (handleMove → engine → setState → FEN updates board)
- [x] Opponent auto-play works (handled in trainingEngine.submitMove; FEN drives board)
- [x] Guided wrong moves allow retry (engine status "wrong", not terminal; pieces still draggable)
- [x] Instinct wrong moves fail the run (engine status "failed"; isTerminal true; pieces locked)
- [x] Board orientation follows lesson side (useBoardOrientation derives from state.userSide)
- [x] Flip board works (flipBoard toggles flipped flag, orientation recalculated)
- [x] Highlighting works (gold on correct, red on illegal/wrong — fixed in F-001)
- [x] UI remains tablet-friendly (flex-col lg:flex-row, max-w-5xl, 560px board cap)
- [x] Training logic not in React components (handleMove → useTrainingSession → trainingEngine)
- [x] UI does not access Dexie directly (no db import in Practice.tsx)
- [x] DS route still dev-gated (import.meta.env.DEV guard unchanged in App.tsx)
- [x] Build passes (tsc --noEmit clean)
- [x] Lint passes (eslint 0 errors)
- [x] Tests pass (204/204)
- [x] HANDOFF updated (TASK-011 entry present)
