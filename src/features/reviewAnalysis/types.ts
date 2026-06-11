export type MoveClassification =
  | "SMART_MOVE"
  | "GOOD_MOVE"
  | "SAFE_MOVE"
  | "WATCH_OUT"
  | "OOPS";

export type ReasonCode =
  | "OPENING_MOVE"
  | "BEST_MOVE"
  | "OPENING_EXIT"
  | "LARGE_EVAL_DROP"
  | "EVAL_DROP"
  | "SOLID_MOVE"
  | "SAFE_MOVE";

export type MoveClassificationResult = {
  moveSan: string;
  classification: MoveClassification;
  reasonCode: ReasonCode;
};

export type ClassifierInput = {
  moveSan: string;
  expectedMoveSan?: string;
  bestMoveSan?: string;
  /** Centipawns lost from the player's perspective (positive = player's position worsened). Caller computes with side awareness. */
  evalDrop?: number;
  openingExitDetected?: boolean;
};

/** Alias for MoveClassificationResult — used by consumers (e.g. TASK-018B timeline). */
export type ReviewedMove = MoveClassificationResult;
