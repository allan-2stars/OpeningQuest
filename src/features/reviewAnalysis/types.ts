export type MoveClassification =
  | "SMART_MOVE"
  | "GOOD_MOVE"
  | "SAFE_MOVE"
  | "WATCH_OUT"
  | "OOPS";

export type MoveClassificationResult = {
  moveSan: string;
  classification: MoveClassification;
  reasonCode: string;
};

export type ClassifierInput = {
  moveSan: string;
  expectedMoveSan?: string;
  bestMoveSan?: string;
  evaluationBefore?: number;
  evaluationAfter?: number;
  openingExitDetected?: boolean;
};

export type ReviewedMove = {
  moveSan: string;
  classification: MoveClassification;
  reasonCode: string;
};
