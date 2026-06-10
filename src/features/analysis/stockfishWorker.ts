// stockfishWorker.ts — Web Worker that runs Stockfish via UCI protocol
// This file is bundled by Vite as a separate worker chunk.

import Stockfish from "stockfish.js";

type WorkerCommand =
  | { type: "init" }
  | { type: "analyse"; fen: string; depth?: number }
  | { type: "stop" }
  | { type: "quit" };

const engine = Stockfish();
let isReady = false;

engine.onmessage = (event: { data?: string } | string) => {
  const line = typeof event === "string" ? event : (event.data ?? "");
  if (typeof line !== "string" || !line) return;

  if (line.startsWith("uciok")) {
    isReady = true;
    self.postMessage({ type: "ready" });
  } else if (line.startsWith("bestmove")) {
    self.postMessage({ type: "bestmove", data: line });
  } else if (line.startsWith("info")) {
    self.postMessage({ type: "info", data: line });
  }
};

self.onmessage = (event: MessageEvent<WorkerCommand>) => {
  const msg = event.data;

  switch (msg.type) {
    case "init":
      engine.postMessage("uci");
      break;
    case "analyse":
      if (!isReady || !msg.fen) return;
      engine.postMessage("ucinewgame");
      engine.postMessage("position fen " + msg.fen);
      engine.postMessage("go depth " + (msg.depth ?? 12));
      break;
    case "stop":
      engine.postMessage("stop");
      break;
    case "quit":
      engine.postMessage("quit");
      break;
  }
};

// Start init immediately
engine.postMessage("uci");
