# INVESTIGATION-002 — Practice Page Blank Screen

Date: 2026-06-10
Investigator: Windows Agent (cc DS)
Status: Resolved

---

## Symptom

Selecting "Italian Main Line" from the Adventure map navigates to `/practice/lesson_w1_italian_main`. The entire page renders as a dark blank screen: no navigation bar, no lesson title, no chessboard, no error message.

## Reproduction

1. Start the app (`docker compose up --build`)
2. Navigate to Adventure page
3. Click "Italian Main Line" node
4. Observe: entire page is dark blank (only `bg-slate-950` body background visible)

## Root Cause

**react-chessboard 1.3.1 crashes during render when required props are not explicitly provided, because React 19 does not apply `defaultProps` from function components.**

The crash path chain:

1. React 19 ignores `Chessboard.defaultProps` (deprecated for function components in React 18+, behavior diverges in React 19)
2. `arePiecesDraggable` defaults to `true` from our prop, so drag sources are set up via `useDrag()`
3. `useDrag`'s collector calls `isDraggablePiece(piece)` internally, expecting a function
4. `isDraggablePiece` is `undefined` (defaultProps not applied) — calling `undefined(piece)` throws `TypeError: isDraggablePiece is not a function`
5. The error occurs during React render (inside the `useState` initializer of a child hook), not during an event handler
6. With no error boundary, React unmounts the entire component tree from the crash point up to `<BrowserRouter>`
7. The user sees only the dark `body` background — a "blank screen"

### Evidence

Minimal reproduction (confirmed failing in vitest + jsdom):

```tsx
// Crashes with: TypeError: isDraggablePiece is not a function
<Chessboard position="start" boardWidth={400} customBoardStyle={{}} />
```

The crash trace points to `react-chessboard/dist/index.js:6316` inside `useDrag`'s collector, called during the render phase.

Conversely, passing `isDraggablePiece` explicitly fixes the crash:

```tsx
// Works
<Chessboard
  position="start"
  boardWidth={400}
  customBoardStyle={{}}
  isDraggablePiece={() => true}
/>
```

### Non-causes (verified)

- **boardWidth:** Not the cause. The expression `Math.min(560, window.innerWidth - 48)` evaluates to a valid positive number in all real browser viewports.
- **Seed data:** Not the cause. INVESTIGATION-001 fixed seed execution. The lesson loads correctly (confirmed by integration test).
- **Training hook:** Not the cause. `useTrainingSession` correctly loads and returns lesson data.
- **Routing:** Not the cause. The route pattern `/practice/:lessonId` correctly matches.
- **Module resolution:** Not the cause. All Vite module requests return 200.
- **CSS:** Not the cause. The blank screen is a React unmount, not a visibility issue.
- **react-dnd:** Not the cause. `react-dnd` and `react-dnd-html5-backend` are installed and resolve correctly.

## Fix

Two changes:

1. **File: `src/features/practice/Practice.tsx`** — Pass `isDraggablePiece` explicitly to `<Chessboard>`:

```tsx
<Chessboard
  ...
  isDraggablePiece={() => true}
/>
```

2. **File: `src/features/practice/Practice.tsx`** — Guard `boardWidth` against degenerate values (belt-and-suspenders):

```tsx
const boardWidth = typeof window !== "undefined"
  ? Math.max(200, Math.min(560, window.innerWidth - 48))
  : 480;
```

## Regression Risk

Low. Both changes are purely additive:
- `isDraggablePiece={() => true}` means all pieces are draggable, which matches the existing `arePiecesDraggable` behavior
- The `Math.max(200, ...)` guard ensures boardWidth is never below 200px even in edge cases

## Tests Added

- Regression test: Practice page renders chessboard without crash
- Regression test: Italian Main Line title appears after load
- Chessboard smoke test with explicit `isDraggablePiece` prop
