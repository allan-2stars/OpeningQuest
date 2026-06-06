import { Chess } from "chess.js";
import type { PracticeMode, Side } from "../../types/domain.ts";
import type {
  TrainingSessionState,
  TrainingSessionResult,
  MoveFeedback,
  FeedbackType,
} from "./types.ts";

function buildFeedback(
  type: FeedbackType,
  legal: boolean,
  correct: boolean,
  san: string,
  expected: string,
  mode: PracticeMode,
): MoveFeedback {
  if (!legal) {
    return { type: "wrong", legal: false, correct: false, san, message: "Illegal move. Try a different move." };
  }
  if (type === "opponent") {
    return { type: "opponent", legal: true, correct: true, san, message: `Opponent played ${san}` };
  }
  if (correct) {
    return { type: "accepted", legal: true, correct: true, san, message: "Correct!" };
  }
  if (mode === "guided") {
    return {
      type: "wrong",
      legal: true,
      correct: false,
      san,
      message: `Not the expected move. Expected: ${expected}. Try again.`,
    };
  }
  return {
    type: "wrong",
    legal: true,
    correct: false,
    san,
    message: `Wrong move. The expected move was: ${expected}. Run failed.`,
  };
}

function totalUserMoves(sanMovesLength: number, userSide: Side): number {
  return userSide === "white" ? Math.ceil(sanMovesLength / 2) : Math.floor(sanMovesLength / 2);
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
    userMoveCount: 0,
    totalUserMoves: totalUserMoves(sanMoves.length, userSide),
    status: "waiting",
    lastFeedback: null,
    history: [],
  };
}

export function submitMove(
  state: TrainingSessionState,
  san: string,
  sanMoves: string[],
  lessonId: string,
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
      const fb = buildFeedback("wrong", false, false, san, expected, state.mode);
      return {
        state: { ...state, lastFeedback: fb, status: "wrong" },
      };
    }
    playedSan = moveResult.san;
  } catch {
    const fb = buildFeedback("wrong", false, false, san, expected, state.mode);
    return {
      state: { ...state, lastFeedback: fb, status: "wrong" },
    };
  }
  const isCorrect = playedSan === expected;

  if (!isCorrect) {
    const fb = buildFeedback("wrong", true, false, playedSan, expected, state.mode);
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
        result: makeResult(lessonId, state, false, state.mistakes + 1, history),
      };
    }

    // Guided mode: wrong move counts as a mistake but allows retry
    return {
      state: {
        ...state,
        lastFeedback: fb,
        mistakes: state.mistakes + 1,
        status: "wrong",
        history,
      },
    };
  }

  // Correct move — advance
  const fb = buildFeedback("accepted", true, true, playedSan, expected, state.mode);
  const history = [...state.history, fb];
  const newUserMoveCount = state.userMoveCount + 1;
  let newIndex = state.currentMoveIndex + 1;

  // Auto-play opponent's next moves, recording each in history
  try {
    while (newIndex < sanMoves.length && !isUserTurn(newIndex, state.userSide)) {
      const oppSan = chess.move(sanMoves[newIndex]).san;
      history.push(buildFeedback("opponent", true, true, oppSan, sanMoves[newIndex], state.mode));
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
        userMoveCount: newUserMoveCount,
        lastFeedback: fb,
        status: "complete",
        history,
      },
      result: makeResult(lessonId, state, true, state.mistakes, history, perfectRun),
    };
  }

  return {
    state: {
      ...state,
      fen: chess.fen(),
      currentMoveIndex: newIndex,
      userMoveCount: newUserMoveCount,
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
  lessonId: string,
  state: TrainingSessionState,
  completed: boolean,
  mistakes: number,
  history: MoveFeedback[],
  perfectRun = false,
): TrainingSessionResult {
  return {
    lessonId,
    mode: state.mode,
    completed,
    mistakes,
    totalMoves: state.totalMoves,
    totalUserMoves: state.totalUserMoves,
    perfectRun: completed && mistakes === 0 && perfectRun,
    history,
  };
}
