import { describe, it, expect } from "vitest";
import { Chess } from "chess.js";
import { initSession, submitMove } from "../trainingEngine.ts";

const ITALIAN_LINE = ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3"];

describe("initSession", () => {
  it("initializes for white user — user plays first move", () => {
    const state = initSession(ITALIAN_LINE, "white", "guided");
    expect(state.fen).toBe("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    expect(state.currentMoveIndex).toBe(0);
    expect(state.userSide).toBe("white");
    expect(state.status).toBe("waiting");
    expect(state.mistakes).toBe(0);
  });

  it("initializes for black user — engine plays first move", () => {
    const state = initSession(ITALIAN_LINE, "black", "guided");
    // After 1. e4
    expect(state.currentMoveIndex).toBe(1);
    expect(state.fen).not.toBe("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  });

  it("initializes for black with empty line", () => {
    const state = initSession([], "black", "guided");
    expect(state.currentMoveIndex).toBe(1);
    expect(state.totalMoves).toBe(0);
  });

  it("initializes in instinct mode", () => {
    const state = initSession(ITALIAN_LINE, "white", "instinct");
    expect(state.mode).toBe("instinct");
  });
});

describe("submitMove — correct moves", () => {
  it("accepts a correct move and advances the state", () => {
    const state = initSession(ITALIAN_LINE, "white", "guided");
    const { state: next } = submitMove(state, "e4", ITALIAN_LINE);

    expect(next.lastFeedback?.correct).toBe(true);
    expect(next.lastFeedback?.message).toBe("Correct!");
    expect(next.currentMoveIndex).toBe(2); // skipped 1 (opponent auto-played e5)
    expect(next.status).toBe("correct");
    expect(next.mistakes).toBe(0);
  });

  it("auto-plays opponent move after correct user move", () => {
    const state = initSession(ITALIAN_LINE, "white", "guided");
    const { state: next } = submitMove(state, "e4", ITALIAN_LINE);

    // Position should be after 1. e4 e5 — black has just moved, white's turn
    const chess = new Chess(next.fen);
    expect(chess.turn()).toBe("w");
  });

  it("completes the session after the last move", () => {
    const shortLine = ["e4", "e5"];
    const state = initSession(shortLine, "white", "guided");
    const { state: next, result } = submitMove(state, "e4", shortLine);

    expect(next.status).toBe("complete");
    expect(result).toBeDefined();
    expect(result!.completed).toBe(true);
    expect(result!.perfectRun).toBe(true);
    expect(result!.mistakes).toBe(0);
  });

  it("completes a full line for black user", () => {
    const shortLine = ["e4", "e5", "Nf3"];
    // User is black: engine plays e4, user plays e5, engine plays Nf3
    const state = initSession(shortLine, "black", "guided");
    expect(state.currentMoveIndex).toBe(1); // engine played e4

    const { state: next, result } = submitMove(state, "e5", shortLine);
    expect(next.status).toBe("complete");
    expect(result!.completed).toBe(true);
    expect(result!.perfectRun).toBe(true);
  });

  it("accepts SAN variants that chess.js normalizes", () => {
    const state = initSession(ITALIAN_LINE, "white", "guided");
    // "Nf3" can also be written "Ng1f3" — both are legal, but only "Nf3" matches
    const { state: next } = submitMove(state, "e4", ITALIAN_LINE);
    // After auto-play, current move should be Nf3
    expect(next.currentMoveIndex).toBe(2);

    const { state: next2 } = submitMove(next, "Ng1f3", ITALIAN_LINE);
    // chess.js normalizes to "Nf3" — so this is a correct match
    expect(next2.lastFeedback?.correct).toBe(true);
  });
});

describe("submitMove — illegal moves", () => {
  it("rejects an illegal move without changing the board", () => {
    const state = initSession(ITALIAN_LINE, "white", "guided");
    const { state: next } = submitMove(state, "Qh5", ITALIAN_LINE);

    expect(next.lastFeedback?.legal).toBe(false);
    expect(next.lastFeedback?.correct).toBe(false);
    expect(next.fen).toBe(state.fen); // position unchanged
    expect(next.currentMoveIndex).toBe(state.currentMoveIndex);
    expect(next.status).toBe("wrong");
  });

  it("does not count illegal moves as mistakes", () => {
    const state = initSession(ITALIAN_LINE, "white", "guided");
    const { state: next } = submitMove(state, "Qh5", ITALIAN_LINE);
    expect(next.mistakes).toBe(0);
  });
});

describe("submitMove — wrong move in guided mode", () => {
  it("shows feedback but does not advance", () => {
    const state = initSession(ITALIAN_LINE, "white", "guided");
    const { state: next } = submitMove(state, "d4", ITALIAN_LINE);

    expect(next.lastFeedback?.correct).toBe(false);
    expect(next.lastFeedback?.message).toContain("Expected: e4");
    expect(next.currentMoveIndex).toBe(0); // still waiting for e4
    expect(next.status).toBe("wrong");
  });

  it("does not penalize wrong moves in guided mode", () => {
    const state = initSession(ITALIAN_LINE, "white", "guided");
    const { state: s1 } = submitMove(state, "d4", ITALIAN_LINE);
    const { state: s2 } = submitMove(s1, "d3", ITALIAN_LINE);
    expect(s2.mistakes).toBe(0);
  });

  it("allows retry after wrong move in guided mode", () => {
    const state = initSession(ITALIAN_LINE, "white", "guided");
    const { state: s1 } = submitMove(state, "d4", ITALIAN_LINE);
    expect(s1.currentMoveIndex).toBe(0);

    // Retry with correct move
    const { state: s2 } = submitMove(s1, "e4", ITALIAN_LINE);
    expect(s2.lastFeedback?.correct).toBe(true);
    expect(s2.currentMoveIndex).toBe(2);
  });
});

describe("submitMove — wrong move in instinct mode", () => {
  it("fails the run immediately", () => {
    const state = initSession(ITALIAN_LINE, "white", "instinct");
    const { state: next, result } = submitMove(state, "d4", ITALIAN_LINE);

    expect(next.lastFeedback?.correct).toBe(false);
    expect(next.status).toBe("failed");
    expect(next.mistakes).toBe(1);
    expect(result).toBeDefined();
    expect(result!.completed).toBe(false);
  });

  it("counts wrong moves as mistakes in instinct mode", () => {
    const state = initSession(ITALIAN_LINE, "white", "instinct");
    const { state: next } = submitMove(state, "d4", ITALIAN_LINE);
    expect(next.mistakes).toBe(1);
  });
});

describe("perfect run", () => {
  it("returns perfectRun = true when completed with zero mistakes", () => {
    const shortLine = ["e4", "e5", "Nf3"];
    const state = initSession(shortLine, "white", "guided");
    const { state: next } = submitMove(state, "e4", shortLine);
    expect(next.status).toBe("correct");

    const r2 = submitMove(next, "Nf3", shortLine);
    expect(r2.state.status).toBe("complete");
    expect(r2.result!.perfectRun).toBe(true);
  });

  it("returns perfectRun = false when mistakes were made in instinct and run fails", () => {
    const state = initSession(ITALIAN_LINE, "white", "instinct");
    // Make a wrong move first
    const { state: next, result } = submitMove(state, "d4", ITALIAN_LINE);
    expect(next.status).toBe("failed");
    expect(result!.perfectRun).toBe(false);
    expect(result!.completed).toBe(false);
    expect(result!.mistakes).toBe(1);
  });
});

describe("state immutability after terminal status", () => {
  it("ignores moves after completion", () => {
    const shortLine = ["e4", "e5"];
    const state = initSession(shortLine, "white", "guided");
    const { state: done } = submitMove(state, "e4", shortLine);
    expect(done.status).toBe("complete");

    const { state: same } = submitMove(done, "Nf3", shortLine);
    expect(same).toBe(done);
  });

  it("ignores moves after instinct failure", () => {
    const state = initSession(ITALIAN_LINE, "white", "instinct");
    const { state: failed } = submitMove(state, "d4", ITALIAN_LINE);
    expect(failed.status).toBe("failed");

    const { state: same } = submitMove(failed, "e4", ITALIAN_LINE);
    expect(same).toBe(failed);
  });
});
