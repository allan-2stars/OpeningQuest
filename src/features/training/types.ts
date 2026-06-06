import type { PracticeMode, Side } from "../../types/domain.ts";

export type TrainingStatus =
  | "waiting"
  | "correct"
  | "wrong"
  | "complete"
  | "failed";

export type FeedbackType = "accepted" | "wrong" | "opponent";

export type MoveFeedback = {
  type: FeedbackType;
  legal: boolean;
  correct: boolean;
  san: string;
  message: string;
};

export type TrainingSessionState = {
  fen: string;
  currentMoveIndex: number;
  totalMoves: number;
  userSide: Side;
  mode: PracticeMode;
  mistakes: number;
  userMoveCount: number;
  totalUserMoves: number;
  status: TrainingStatus;
  lastFeedback: MoveFeedback | null;
  history: MoveFeedback[];
};

export type TrainingSessionResult = {
  lessonId: string;
  mode: PracticeMode;
  completed: boolean;
  mistakes: number;
  totalMoves: number;
  totalUserMoves: number;
  perfectRun: boolean;
  history: MoveFeedback[];
};
