export type AnalysisResult = {
  /** Best move in SAN notation */
  bestMove: string;
  /** Evaluation in centipawns: positive = white better, negative = black better */
  evaluation: number;
  /** Engine search depth reached */
  depth: number;
  /** Principal variation (sequence of best moves), or empty if unavailable */
  pv: string[];
};

export type AnalysisError = {
  type: "invalid_fen" | "engine_timeout" | "engine_error" | "worker_terminated";
  message: string;
};

export type AnalysisStatus = "idle" | "loading" | "ready" | "analysing" | "error" | "terminated";
