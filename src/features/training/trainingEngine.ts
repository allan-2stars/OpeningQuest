import { Chess } from "chess.js";
import type { PracticeMode, Side } from "../../types/domain.ts";
import type {
  TrainingSessionState,
  TrainingSessionResult,
  MoveFeedback,
} from "./types.ts";

function buildFeedback(
  legal: boolean,
  correct: boolean,
  san: string,
  expected: string,
  mode: PracticeMode,
): MoveFeedback {
  if (!legal) {
    return { legal: false, correct: false, san, message: "Illegal move. Try a different move." };
  }
  if (correct) {
    return { legal: true, correct: true, san, message: "Correct!" };
  }
  if (mode === "guided") {
    return {
      legal: true,
      correct: false,
      san,
      message: `Not the expected move. Expected: ${expected}. Try again.`,
    };
  }
  return {
    legal: true,
    correct: false,
    san,
    message: `Wrong move. The expected move was: ${expected}. Run failed.`,
  };
}

export function initSession(
  sanMoves: string[],
  userSide: Side,
  mode: PracticeMode,
): TrainingSessionState {
  const chess = new Chess();

  // If the user is black, the engine plays the first white move automatically
  if (userSide === "black" && sanMoves.length > 0) {
    chess.move(sanMoves[0]);
  }

  return {
    fen: chess.fen(),
    currentMoveIndex: userSide === "white" ? 0 : 1,
    totalMoves: sanMoves.length,
    userSide,
    mode,
    mistakes: 0,
    status: "waiting",
    lastFeedback: null,
    history: [],
  };
}

export function submitMove(
  state: TrainingSessionState,
  san: string,
  sanMoves: string[],
): { state: TrainingSessionState; result?: TrainingSessionResult } {
  if (state.status === "complete" || state.status === "failed") {
    return { state };
  }

  const chess = new Chess(state.fen);
  const expected = sanMoves[state.currentMoveIndex];

  // Try the move — chess.js throws on illegal moves
  let playedSan: string;
  try {
    const moveResult = chess.move(san);
    if (!moveResult) {
      const fb = buildFeedback(false, false, san, expected, state.mode);
      return {
        state: { ...state, lastFeedback: fb, status: "wrong" },
      };
    }
    playedSan = moveResult.san;
  } catch {
    const fb = buildFeedback(false, false, san, expected, state.mode);
    return {
      state: { ...state, lastFeedback: fb, status: "wrong" },
    };
  }
  const isCorrect = playedSan === expected;

  if (!isCorrect) {
    const fb = buildFeedback(true, false, playedSan, expected, state.mode);
    const history = [...state.history, fb];

    if (state.mode === "instinct") {
      return {
        state: {
          ...state,
          lastFeedback: fb,
          mistakes: state.mistakes + 1,
          status: "failed",
          history,
        },
        result: makeResult(state, false, state.mistakes + 1, history),
      };
    }

    // Guided mode: don't advance, don't penalize
    return {
      state: {
        ...state,
        lastFeedback: fb,
        status: "wrong",
        history,
      },
    };
  }

  // Correct move — advance
  const fb = buildFeedback(true, true, playedSan, expected, state.mode);
  const history = [...state.history, fb];
  let newIndex = state.currentMoveIndex + 1;

  // Auto-play opponent's next move (if any)
  try {
    while (newIndex < sanMoves.length && !isUserTurn(newIndex, state.userSide)) {
      chess.move(sanMoves[newIndex]);
      newIndex++;
    }
  } catch {
    throw new Error(`Invalid opponent move in opening line at position ${newIndex}`);
  }

  const complete = newIndex >= sanMoves.length;
  const perfectRun = complete && state.mistakes === 0;

  if (complete) {
    return {
      state: {
        ...state,
        fen: chess.fen(),
        currentMoveIndex: newIndex,
        lastFeedback: fb,
        status: "complete",
        history,
      },
      result: makeResult(state, true, state.mistakes, history, perfectRun),
    };
  }

  return {
    state: {
      ...state,
      fen: chess.fen(),
      currentMoveIndex: newIndex,
      lastFeedback: fb,
      status: "correct",
      history,
    },
  };
}

function isUserTurn(moveIndex: number, userSide: Side): boolean {
  if (userSide === "white") return moveIndex % 2 === 0;
  return moveIndex % 2 === 1;
}

function makeResult(
  state: TrainingSessionState,
  completed: boolean,
  mistakes: number,
  history: MoveFeedback[],
  perfectRun = false,
): TrainingSessionResult {
  return {
    lessonId: "",
    mode: state.mode,
    completed,
    mistakes,
    totalMoves: state.totalMoves,
    perfectRun: completed && mistakes === 0 && perfectRun,
    history,
  };
}
