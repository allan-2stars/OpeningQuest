/** Status of a player's moves against an expected opening line. */
export type OpeningLineStatus = {
  openingId: string;
  /** Total plies in the expected line */
  totalPly: number;
  /** Player is still following the expected line */
  inLine: boolean;
  /** Player has left the expected line */
  exited: boolean;
  /** The ply number (1-indexed) where the player exited, if any */
  exitPly?: number;
  /** The SAN of the move that deviated from the line */
  exitMoveSan?: string;
  /** The expected SAN at that position */
  expectedMoveSan?: string;
};

/** Persisted result of a completed training session with opening line tracking. */
export type OpeningSessionResult = {
  id: string;
  lessonId: string;
  completed: boolean;
  openingExitDetected: boolean;
  exitPly?: number;
  exitMoveSan?: string;
  expectedMoveSan?: string;
  playedAt: string;
};

/** Aggregate opening exit statistics for the Statistics page or analytics. */
export type OpeningExitStats = {
  totalSessions: number;
  completedInLine: number;
  exitedEarly: number;
};
