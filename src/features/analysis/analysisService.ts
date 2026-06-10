import type { AnalysisResult, AnalysisError, AnalysisStatus } from "./types.ts";

const DEFAULT_DEPTH = 12;
const READY_TIMEOUT_MS = 15000;
const MOVE_TIMEOUT_MS = 30000;

type PendingRequest = {
  resolve: (result: AnalysisResult) => void;
  reject: (error: AnalysisError) => void;
  fen: string;
  timer: ReturnType<typeof setTimeout>;
};

/**
 * Service that owns a Stockfish Web Worker and exposes async analysis methods.
 * Single engine instance — worker is reused across calls.
 */
export class AnalysisService {
  private worker: Worker | null = null;
  private status: AnalysisStatus = "idle";
  private pending: PendingRequest | null = null;
  private readyPromise: Promise<void> | null = null;
  private readyResolve: (() => void) | null = null;
  private lastInfo: { depth: number; cp: number; pv: string[] } | null = null;

  /** Start the engine and wait for it to be ready. */
  startEngine(): Promise<void> {
    if (this.worker) return this.readyPromise ?? Promise.resolve();

    this.status = "loading";

    try {
      this.worker = new Worker(
        new URL("./stockfishWorker.ts", import.meta.url),
        { type: "module" },
      );
    } catch (e) {
      this.status = "error";
      return Promise.reject({
        type: "engine_error",
        message: `Failed to create worker: ${e instanceof Error ? e.message : String(e)}`,
      } satisfies AnalysisError);
    }

    this.readyPromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.status = "error";
        reject({
          type: "engine_timeout",
          message: "Stockfish failed to start within timeout.",
        } satisfies AnalysisError);
      }, READY_TIMEOUT_MS);

      this.readyResolve = () => {
        clearTimeout(timeout);
        this.status = "ready";
        resolve();
      };

      this.worker!.onmessage = (event: MessageEvent) => {
        const msg = event.data;
        if (msg?.type === "ready") {
          this.readyResolve?.();
          this.readyResolve = null;
          return;
        }
        this.handleEngineMessage(msg);
      };

      this.worker!.onerror = () => {
        clearTimeout(timeout);
        this.cancelPending();
        this.status = "error";
        reject({
          type: "engine_error",
          message: "Worker encountered an error.",
        } satisfies AnalysisError);
      };

      this.worker!.postMessage({ type: "init" });
    });

    return this.readyPromise;
  }

  /** Analyse a position. Returns best move, evaluation, depth, and PV. */
  async analysePosition(fen: string, depth = DEFAULT_DEPTH): Promise<AnalysisResult> {
    // Validate FEN before attempting to start engine
    if (!fen || typeof fen !== "string" || fen.split(" ").length < 4) {
      throw {
        type: "invalid_fen",
        message: `Invalid FEN string: "${fen}"`,
      } satisfies AnalysisError;
    }

    if (!this.worker) {
      await this.startEngine();
    }

    if (this.status !== "ready") {
      throw {
        type: "engine_error",
        message: `Engine not ready (status: ${this.status})`,
      } satisfies AnalysisError;
    }

    // Cancel any pending request first
    this.cancelPending();

    return new Promise<AnalysisResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.cancelPending();
        reject({
          type: "engine_timeout",
          message: "Analysis timed out.",
        } satisfies AnalysisError);
      }, MOVE_TIMEOUT_MS);

      this.pending = { resolve, reject, fen, timer };
      this.status = "analysing";
      this.worker!.postMessage({ type: "analyse", fen, depth });
    });
  }

  /** Get best move for a position. Convenience wrapper around analysePosition. */
  async getBestMove(fen: string, depth?: number): Promise<string> {
    const result = await this.analysePosition(fen, depth);
    return result.bestMove;
  }

  /** Get centipawn evaluation for a position. */
  async getEvaluation(fen: string, depth?: number): Promise<number> {
    const result = await this.analysePosition(fen, depth);
    return result.evaluation;
  }

  /** Stop the current analysis (if any) and terminate the worker. */
  stopEngine(): void {
    this.cancelPending();
    if (this.worker) {
      try { this.worker.postMessage({ type: "quit" }); } catch { /* ignore */ }
      this.worker.terminate();
      this.worker = null;
    }
    this.status = "terminated";
    this.readyPromise = null;
    this.readyResolve = null;
  }

  /** Alias for stopEngine. */
  terminateWorker(): void {
    this.stopEngine();
  }

  /** Current engine status. */
  getStatus(): AnalysisStatus {
    return this.status;
  }

  // ── private ──────────────────────────────────────────────

  private cancelPending(): void {
    if (this.pending) {
      clearTimeout(this.pending.timer);
      this.pending.reject({
        type: "engine_error",
        message: "Request cancelled.",
      } satisfies AnalysisError);
      this.pending = null;
      this.lastInfo = null;
    }
    if (this.status === "analysing") {
      try { this.worker?.postMessage({ type: "stop" }); } catch { /* ignore */ }
    }
  }

  private handleEngineMessage(msg: { type: string; data?: string }): void {
    if (!msg || !this.pending) return;

    const line = msg.data ?? "";

    if (msg.type === "bestmove") {
      // Extract best move
      const parts = line.split(" ");
      const bestMove = parts.length >= 2 ? parts[1] : "";

      clearTimeout(this.pending.timer);
      this.status = "ready";

      const info = this.lastInfo;
      this.lastInfo = null;
      this.pending.resolve({
        bestMove,
        evaluation: info?.cp ?? 0,
        depth: info?.depth ?? 0,
        pv: info?.pv ?? [],
      });
      this.pending = null;
    } else if (msg.type === "info") {
      this.parseInfoLine(line);
    }
  }

  private parseInfoLine(line: string): void {
    if (!this.pending) return;

    const tokens = line.split(" ");

    let depth = 0;
    let cp: number | undefined;
    const pv: string[] = [];

    let i = 1; // skip "info"
    while (i < tokens.length) {
      const token = tokens[i];
      if (token === "depth" && i + 1 < tokens.length) {
        depth = parseInt(tokens[++i], 10);
      } else if (token === "cp" && i + 1 < tokens.length) {
        cp = parseInt(tokens[++i], 10);
      } else if (token === "pv") {
        // Remaining tokens are the principal variation
        for (i++; i < tokens.length; i++) {
          pv.push(tokens[i]);
        }
      } else {
        i++;
      }
    }

    if (cp !== undefined && depth > 0) {
      this.lastInfo = { depth, cp, pv };
    }
  }
}

/** Singleton instance — shared across the app. */
export const analysisService = new AnalysisService();
