import { describe, it, expect } from "vitest";
import { Chess } from "chess.js";
import { initSession, submitMove } from "../trainingEngine.ts";

const ITALIAN_LINE = ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3"];
const LID = "lesson_test_1";

describe("initSession", () => {
  it("initializes for white user — user plays first move", () => {
    const state = initSession(ITALIAN_LINE, "white", "guided");
    expect(state.fen).toBe("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    expect(state.currentMoveIndex).toBe(0);
    expect(state.userSide).toBe("white");
    expect(state.status).toBe("waiting");
    expect(state.mistakes).toBe(0);
    expect(state.userMoveCount).toBe(0);
    expect(state.totalUserMoves).toBe(4); // ceil(7/2) = 4
  });

  it("initializes for black user — engine plays first move", () => {
    const state = initSession(ITALIAN_LINE, "black", "guided");
    expect(state.currentMoveIndex).toBe(1);
    expect(state.totalUserMoves).toBe(3); // floor(7/2) = 3
    expect(state.fen).not.toBe("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  });

  it("initializes for black with empty line", () => {
    const state = initSession([], "black", "guided");
    expect(state.currentMoveIndex).toBe(1);
    expect(state.totalMoves).toBe(0);
    expect(state.totalUserMoves).toBe(0);
  });

  it("initializes in instinct mode", () => {
    const state = initSession(ITALIAN_LINE, "white", "instinct");
    expect(state.mode).toBe("instinct");
  });

  it("computes totalUserMoves correctly for white in even-length line", () => {
    const state = initSession(["e4", "e5", "Nf3", "Nc6"], "white", "guided");
    expect(state.totalUserMoves).toBe(2); // positions 0,2 = 2 moves
  });
});

describe("submitMove — correct moves", () => {
  it("accepts a correct move and advances the state", () => {
    const state = initSession(ITALIAN_LINE, "white", "guided");
    const { state: next } = submitMove(state, "e4", ITALIAN_LINE, LID);

    expect(next.lastFeedback?.correct).toBe(true);
    expect(next.lastFeedback?.type).toBe("accepted");
    expect(next.lastFeedback?.message).toBe("Correct!");
    expect(next.currentMoveIndex).toBe(2); // skipped 1 (opponent auto-played e5)
    expect(next.userMoveCount).toBe(1);
    expect(next.status).toBe("correct");
    expect(next.mistakes).toBe(0);
  });

  it("auto-plays opponent move after correct user move", () => {
    const state = initSession(ITALIAN_LINE, "white", "guided");
    const { state: next } = submitMove(state, "e4", ITALIAN_LINE, LID);

    // Position should be after 1. e4 e5 — black has just moved, white's turn
    const chess = new Chess(next.fen);
    expect(chess.turn()).toBe("w");
  });

  it("records opponent auto-play moves in history", () => {
    const state = initSession(ITALIAN_LINE, "white", "guided");
    const { state: next } = submitMove(state, "e4", ITALIAN_LINE, LID);

    // History should have e4 (accepted) then e5 (opponent)
    expect(next.history).toHaveLength(2);
    expect(next.history[0].type).toBe("accepted");
    expect(next.history[0].san).toBe("e4");
    expect(next.history[1].type).toBe("opponent");
    expect(next.history[1].san).toBe("e5");
  });

  it("completes the session after the last move", () => {
    const shortLine = ["e4", "e5"];
    const state = initSession(shortLine, "white", "guided");
    const { state: next, result } = submitMove(state, "e4", shortLine, LID);

    expect(next.status).toBe("complete");
    expect(result).toBeDefined();
    expect(result!.completed).toBe(true);
    expect(result!.perfectRun).toBe(true);
    expect(result!.mistakes).toBe(0);
    expect(result!.lessonId).toBe(LID);
  });

  it("completes a full line for black user", () => {
    const shortLine = ["e4", "e5", "Nf3"];
    const state = initSession(shortLine, "black", "guided");
    expect(state.currentMoveIndex).toBe(1); // engine played e4

    const { state: next, result } = submitMove(state, "e5", shortLine, LID);
    expect(next.status).toBe("complete");
    expect(result!.completed).toBe(true);
    expect(result!.perfectRun).toBe(true);
  });

  it("accepts SAN variants that chess.js normalizes", () => {
    const state = initSession(ITALIAN_LINE, "white", "guided");
    const { state: next } = submitMove(state, "e4", ITALIAN_LINE, LID);
    expect(next.currentMoveIndex).toBe(2);

    const { state: next2 } = submitMove(next, "Ng1f3", ITALIAN_LINE, LID);
    expect(next2.lastFeedback?.correct).toBe(true);
  });
});

describe("submitMove — illegal moves", () => {
  it("rejects an illegal move without changing the board", () => {
    const state = initSession(ITALIAN_LINE, "white", "guided");
    const { state: next } = submitMove(state, "Qh5", ITALIAN_LINE, LID);

    expect(next.lastFeedback?.legal).toBe(false);
    expect(next.lastFeedback?.type).toBe("wrong");
    expect(next.fen).toBe(state.fen);
    expect(next.currentMoveIndex).toBe(state.currentMoveIndex);
    expect(next.status).toBe("wrong");
  });

  it("does not count illegal moves as mistakes", () => {
    const state = initSession(ITALIAN_LINE, "white", "guided");
    const { state: next } = submitMove(state, "Qh5", ITALIAN_LINE, LID);
    expect(next.mistakes).toBe(0);
  });
});

describe("submitMove — wrong move in guided mode", () => {
  it("shows feedback but does not advance", () => {
    const state = initSession(ITALIAN_LINE, "white", "guided");
    const { state: next } = submitMove(state, "d4", ITALIAN_LINE, LID);

    expect(next.lastFeedback?.correct).toBe(false);
    expect(next.lastFeedback?.type).toBe("wrong");
    expect(next.lastFeedback?.message).toContain("Expected: e4");
    expect(next.currentMoveIndex).toBe(0);
    expect(next.status).toBe("wrong");
  });

  it("counts wrong moves as mistakes in guided mode", () => {
    const state = initSession(ITALIAN_LINE, "white", "guided");
    const { state: s1 } = submitMove(state, "d4", ITALIAN_LINE, LID);
    expect(s1.mistakes).toBe(1);

    const { state: s2 } = submitMove(s1, "d3", ITALIAN_LINE, LID);
    expect(s2.mistakes).toBe(2);
  });

  it("allows retry after wrong move in guided mode", () => {
    const state = initSession(ITALIAN_LINE, "white", "guided");
    const { state: s1 } = submitMove(state, "d4", ITALIAN_LINE, LID);
    expect(s1.currentMoveIndex).toBe(0);
    expect(s1.mistakes).toBe(1);

    // Retry with correct move
    const { state: s2 } = submitMove(s1, "e4", ITALIAN_LINE, LID);
    expect(s2.lastFeedback?.correct).toBe(true);
    expect(s2.currentMoveIndex).toBe(2);
    expect(s2.mistakes).toBe(1); // mistake count preserved
  });

  it("does not produce a perfect run after guided wrong moves", () => {
    const shortLine = ["e4", "e5", "Nf3"];
    const state = initSession(shortLine, "white", "guided");
    // Wrong move first
    const { state: s1 } = submitMove(state, "d4", shortLine, LID);
    expect(s1.mistakes).toBe(1);
    // Then correct
    const { state: s2 } = submitMove(s1, "e4", shortLine, LID);
    const { state: s3, result } = submitMove(s2, "Nf3", shortLine, LID);

    expect(s3.status).toBe("complete");
    expect(result).toBeDefined();
    expect(result!.completed).toBe(true);
    expect(result!.mistakes).toBe(1);
    expect(result!.perfectRun).toBe(false);
    expect(result!.lessonId).toBe(LID);
  });
});

describe("submitMove — wrong move in instinct mode", () => {
  it("fails the run immediately", () => {
    const state = initSession(ITALIAN_LINE, "white", "instinct");
    const { state: next, result } = submitMove(state, "d4", ITALIAN_LINE, LID);

    expect(next.lastFeedback?.correct).toBe(false);
    expect(next.lastFeedback?.type).toBe("wrong");
    expect(next.status).toBe("failed");
    expect(next.mistakes).toBe(1);
    expect(result).toBeDefined();
    expect(result!.completed).toBe(false);
    expect(result!.lessonId).toBe(LID);
  });

  it("counts wrong moves as mistakes in instinct mode", () => {
    const state = initSession(ITALIAN_LINE, "white", "instinct");
    const { state: next } = submitMove(state, "d4", ITALIAN_LINE, LID);
    expect(next.mistakes).toBe(1);
  });
});

describe("perfect run", () => {
  it("returns perfectRun = true when completed with zero mistakes", () => {
    const shortLine = ["e4", "e5", "Nf3"];
    const state = initSession(shortLine, "white", "guided");
    const { state: next } = submitMove(state, "e4", shortLine, LID);
    expect(next.status).toBe("correct");

    const r2 = submitMove(next, "Nf3", shortLine, LID);
    expect(r2.state.status).toBe("complete");
    expect(r2.result!.perfectRun).toBe(true);
  });

  it("returns perfectRun = false when mistakes were made in instinct and run fails", () => {
    const state = initSession(ITALIAN_LINE, "white", "instinct");
    const { state: next, result } = submitMove(state, "d4", ITALIAN_LINE, LID);
    expect(next.status).toBe("failed");
    expect(result!.perfectRun).toBe(false);
    expect(result!.completed).toBe(false);
    expect(result!.mistakes).toBe(1);
  });
});

describe("result lessonId", () => {
  it("includes the lessonId in the result", () => {
    const shortLine = ["e4", "e5"];
    const state = initSession(shortLine, "white", "guided");
    const { result } = submitMove(state, "e4", shortLine, "my_lesson_42");
    expect(result!.lessonId).toBe("my_lesson_42");
  });
});

describe("userMoveCount tracking", () => {
  it("increments on each correct user move", () => {
    const state = initSession(ITALIAN_LINE, "white", "guided");
    expect(state.userMoveCount).toBe(0);
    expect(state.totalUserMoves).toBe(4);

    const { state: s1 } = submitMove(state, "e4", ITALIAN_LINE, LID);
    expect(s1.userMoveCount).toBe(1); // played e4

    const { state: s2 } = submitMove(s1, "Nf3", ITALIAN_LINE, LID);
    expect(s2.userMoveCount).toBe(2); // played Nf3
  });

  it("does not increment on wrong moves or opponent auto-plays", () => {
    const state = initSession(ITALIAN_LINE, "white", "guided");
    const { state: s1 } = submitMove(state, "d4", ITALIAN_LINE, LID);
    expect(s1.userMoveCount).toBe(0); // wrong, no increment
  });
});

describe("history types", () => {
  it("records correct moves as type 'accepted'", () => {
    const state = initSession(ITALIAN_LINE, "white", "guided");
    const { state: next } = submitMove(state, "e4", ITALIAN_LINE, LID);
    const userFeedbacks = next.history.filter((f) => f.type === "accepted");
    expect(userFeedbacks).toHaveLength(1);
    expect(userFeedbacks[0].san).toBe("e4");
  });

  it("records wrong moves as type 'wrong'", () => {
    const state = initSession(ITALIAN_LINE, "white", "guided");
    const { state: next } = submitMove(state, "d4", ITALIAN_LINE, LID);
    expect(next.history[0].type).toBe("wrong");
  });

  it("records opponent auto-play moves as type 'opponent'", () => {
    const state = initSession(ITALIAN_LINE, "white", "guided");
    const { state: next } = submitMove(state, "e4", ITALIAN_LINE, LID);
    const oppFeedbacks = next.history.filter((f) => f.type === "opponent");
    expect(oppFeedbacks).toHaveLength(1);
    expect(oppFeedbacks[0].san).toBe("e5");
  });
});

describe("state immutability after terminal status", () => {
  it("ignores moves after completion", () => {
    const shortLine = ["e4", "e5"];
    const state = initSession(shortLine, "white", "guided");
    const { state: done } = submitMove(state, "e4", shortLine, LID);
    expect(done.status).toBe("complete");

    const { state: same } = submitMove(done, "Nf3", shortLine, LID);
    expect(same).toBe(done);
  });

  it("ignores moves after instinct failure", () => {
    const state = initSession(ITALIAN_LINE, "white", "instinct");
    const { state: failed } = submitMove(state, "d4", ITALIAN_LINE, LID);
    expect(failed.status).toBe("failed");

    const { state: same } = submitMove(failed, "e4", ITALIAN_LINE, LID);
    expect(same).toBe(failed);
  });
});
