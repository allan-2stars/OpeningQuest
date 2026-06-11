import type { TrainingSessionResult } from "../../features/training/types.ts";
import type { ReviewedMove, MoveClassification, ReasonCode } from "../../features/reviewAnalysis/types.ts";
import type { OpeningLineStatus } from "../../features/openings/types.ts";

/** Summary counts for a review result. */
export type ReviewSummary = {
  smartMoves: number;
  goodMoves: number;
  safeMoves: number;
  watchOuts: number;
  oopses: number;
};

/** A complete review of a single lesson session. */
export type LessonReviewResult = {
  lessonId: string;
  completedAt: string;
  completed: boolean;
  moves: ReviewedMove[];
  summary: ReviewSummary;
};

/**
 * Build a LessonReviewResult from raw training session data.
 * Pure function — no side effects, no engine, no DB.
 */
export function buildReviewResult(
  result: TrainingSessionResult,
  completedAt: string,
  openingStatus?: OpeningLineStatus,
): LessonReviewResult {
  const moves: ReviewedMove[] = [];

  // Extract user moves (accepted and wrong) from the session history
  const userMoves = result.history.filter(
    (h) => h.type === "accepted" || h.type === "wrong",
  );

  for (const move of userMoves) {
    const classification = classifyMoveSnapshot(move, openingStatus);
    moves.push({
      moveSan: move.san,
      classification,
      reasonCode: getReasonForMove(move, openingStatus),
    });
  }

  const summary = buildSummary(moves);

  return {
    lessonId: result.lessonId,
    completedAt,
    completed: result.completed,
    moves,
    summary,
  };
}

function classifyMoveSnapshot(
  move: { correct: boolean; type: string; san: string },
  openingStatus?: OpeningLineStatus,
): MoveClassification {
  if (move.correct) {
    // Was this the opening exit move? Check if the SAN matches the exit move
    if (openingStatus?.exited && move.san === openingStatus.exitMoveSan) {
      return "WATCH_OUT";
    }
    if (openingStatus && !openingStatus.exited) {
      return "SMART_MOVE";
    }
    return "GOOD_MOVE";
  }

  // Wrong move
  if (openingStatus?.exited && move.san === openingStatus.exitMoveSan) {
    return "WATCH_OUT";
  }
  return "OOPS";
}

function getReasonForMove(
  move: { correct: boolean; san: string },
  openingStatus?: OpeningLineStatus,
): ReasonCode {
  if (move.correct) {
    if (openingStatus?.exited && move.san === openingStatus.exitMoveSan) {
      return "OPENING_EXIT";
    }
    if (openingStatus && !openingStatus.exited) {
      return "OPENING_MOVE";
    }
    return "SOLID_MOVE";
  }

  // Wrong move — exitMoveSan always comes from a correct played move, so this guard
  // is a safety net for symmetry with classifyMoveSnapshot
  if (openingStatus?.exited && move.san === openingStatus.exitMoveSan) {
    return "OPENING_EXIT";
  }
  return "LARGE_EVAL_DROP";
}

function buildSummary(moves: ReviewedMove[]): ReviewSummary {
  return {
    smartMoves: moves.filter((m) => m.classification === "SMART_MOVE").length,
    goodMoves: moves.filter((m) => m.classification === "GOOD_MOVE").length,
    safeMoves: moves.filter((m) => m.classification === "SAFE_MOVE").length,
    watchOuts: moves.filter((m) => m.classification === "WATCH_OUT").length,
    oopses: moves.filter((m) => m.classification === "OOPS").length,
  };
}
