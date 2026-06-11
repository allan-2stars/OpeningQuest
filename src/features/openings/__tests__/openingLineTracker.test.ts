import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../../../lib/db.ts";
import { evaluateOpeningLine } from "../openingLineTracker.ts";
import {
  saveOpeningSessionResult,
  getOpeningExitStats,
  getRecentSessionResults,
  buildSessionResult,
} from "../openingSessionRepo.ts";
import { seedCoreData } from "../../../lib/seed/seed.ts";

const ITALIAN_MOVES = ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3"];

describe("evaluateOpeningLine", () => {
  it("returns inLine=true for a perfectly matching sequence", () => {
    const status = evaluateOpeningLine("test", ITALIAN_MOVES, ITALIAN_MOVES);
    expect(status.inLine).toBe(true);
    expect(status.exited).toBe(false);
    expect(status.exitPly).toBeUndefined();
  });

  it("returns inLine=true for a partial matching sequence", () => {
    const played = ["e4", "e5", "Nf3"];
    const status = evaluateOpeningLine("test", ITALIAN_MOVES, played);
    expect(status.inLine).toBe(true);
    expect(status.exited).toBe(false);
  });

  it("returns inLine=true for empty played sequence", () => {
    const status = evaluateOpeningLine("test", ITALIAN_MOVES, []);
    expect(status.inLine).toBe(true);
    expect(status.exited).toBe(false);
  });

  it("detects first-move exit", () => {
    const played = ["d4"];
    const status = evaluateOpeningLine("test", ITALIAN_MOVES, played);
    expect(status.inLine).toBe(false);
    expect(status.exited).toBe(true);
    expect(status.exitPly).toBe(1);
    expect(status.exitMoveSan).toBe("d4");
    expect(status.expectedMoveSan).toBe("e4");
  });

  it("detects mid-line exit", () => {
    const played = ["e4", "e5", "Nf3", "Nc6", "a4"];
    const status = evaluateOpeningLine("test", ITALIAN_MOVES, played);
    expect(status.inLine).toBe(false);
    expect(status.exited).toBe(true);
    expect(status.exitPly).toBe(5);
    expect(status.exitMoveSan).toBe("a4");
    expect(status.expectedMoveSan).toBe("Bc4");
  });

  it("detects exit on the last move", () => {
    const played = ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "d4"];
    const status = evaluateOpeningLine("test", ITALIAN_MOVES, played);
    expect(status.inLine).toBe(false);
    expect(status.exited).toBe(true);
    expect(status.exitPly).toBe(7);
    expect(status.exitMoveSan).toBe("d4");
    expect(status.expectedMoveSan).toBe("c3");
  });

  it("sets totalPly to expected line length", () => {
    const status = evaluateOpeningLine("test", ITALIAN_MOVES, ["e4"]);
    expect(status.totalPly).toBe(7);
  });

  it("does not exit when played has fewer moves but still matches", () => {
    const played = ITALIAN_MOVES.slice(0, 4);
    const status = evaluateOpeningLine("test", ITALIAN_MOVES, played);
    expect(status.inLine).toBe(true);
    expect(status.exited).toBe(false);
  });
});

beforeEach(async () => {
  await db.delete();
  await db.open();
  await seedCoreData();
});

describe("openingSessionRepo", () => {
  it("saves and retrieves opening session results", async () => {
    const r = buildSessionResult("lesson_w1_italian_main", true, false);
    await saveOpeningSessionResult(r);

    const results = await getRecentSessionResults();
    expect(results).toHaveLength(1);
    expect(results[0].lessonId).toBe("lesson_w1_italian_main");
    expect(results[0].openingExitDetected).toBe(false);
  });

  it("saves exit results correctly", async () => {
    const r = buildSessionResult("lesson_w1_italian_main", false, true, 5, "a4", "Bc4");
    await saveOpeningSessionResult(r);

    const results = await getRecentSessionResults();
    expect(results[0].exitPly).toBe(5);
    expect(results[0].exitMoveSan).toBe("a4");
    expect(results[0].expectedMoveSan).toBe("Bc4");
  });

  it("getOpeningExitStats aggregates correctly", async () => {
    await saveOpeningSessionResult(buildSessionResult("a", true, false));
    await saveOpeningSessionResult(buildSessionResult("b", true, true, 3, "d4", "e4"));
    await saveOpeningSessionResult(buildSessionResult("c", false, true, 1, "a3", "e4"));

    const stats = await getOpeningExitStats();
    expect(stats.totalSessions).toBe(3);
    expect(stats.completedInLine).toBe(1);
    expect(stats.exitedEarly).toBe(2);
  });

  it("returns zero stats for empty DB", async () => {
    const stats = await getOpeningExitStats();
    expect(stats.totalSessions).toBe(0);
    expect(stats.completedInLine).toBe(0);
    expect(stats.exitedEarly).toBe(0);
  });

  it("getRecentSessionResults respects limit", async () => {
    for (let i = 0; i < 25; i++) {
      await saveOpeningSessionResult(buildSessionResult(`lesson_${i}`, true, false));
    }
    const results = await getRecentSessionResults(10);
    expect(results).toHaveLength(10);
  });

  it("getRecentSessionResults returns empty for no data", async () => {
    const results = await getRecentSessionResults();
    expect(results).toHaveLength(0);
  });
});
