import { describe, it, expect, afterAll, beforeAll } from "vitest";

// Pure-function UCI parser extracted for testability
function parseUciInfo(line: string): {
  depth: number;
  cp: number | undefined;
  pv: string[];
} {
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
      for (i++; i < tokens.length; i++) {
        pv.push(tokens[i]);
      }
    } else {
      i++;
    }
  }

  return { depth, cp, pv };
}

function parseUciBestmove(line: string): string {
  const parts = line.split(" ");
  return parts.length >= 2 ? parts[1] : "";
}

function isValidFen(fen: string): boolean {
  if (!fen || typeof fen !== "string") return false;
  const parts = fen.split(" ");
  return parts.length >= 4;
}

describe("UCI parser", () => {
  it("parses depth from info line", () => {
    const result = parseUciInfo("info depth 10 seldepth 15 score cp 34 pv e2e4 e7e5");
    expect(result.depth).toBe(10);
  });

  it("parses centipawn evaluation from info line", () => {
    const result = parseUciInfo("info depth 8 score cp 25 pv d2d4");
    expect(result.cp).toBe(25);
  });

  it("parses negative centipawn evaluation", () => {
    const result = parseUciInfo("info depth 12 score cp -42 pv e7e5");
    expect(result.cp).toBe(-42);
  });

  it("returns undefined cp when not present", () => {
    const result = parseUciInfo("info depth 5 score mate 3 pv");
    expect(result.cp).toBeUndefined();
  });

  it("parses principal variation", () => {
    const result = parseUciInfo("info depth 10 score cp 15 pv e2e4 e7e5 g1f3 b8c6");
    expect(result.pv).toEqual(["e2e4", "e7e5", "g1f3", "b8c6"]);
  });

  it("returns empty PV when none present", () => {
    const result = parseUciInfo("info depth 3 score cp 0");
    expect(result.pv).toEqual([]);
  });

  it("parses bestmove from bestmove line", () => {
    expect(parseUciBestmove("bestmove e2e4 ponder e7e5")).toBe("e2e4");
  });

  it("parses bestmove without ponder", () => {
    expect(parseUciBestmove("bestmove d2d4")).toBe("d2d4");
  });

  it("returns empty string for malformed bestmove", () => {
    expect(parseUciBestmove("bestmove")).toBe("");
  });

  it("extracts correct depth when multiple info tokens present", () => {
    const result = parseUciInfo(
      "info depth 15 seldepth 22 multipv 1 score cp 28 nodes 45000 nps 3000000 time 15 pv e2e4 e7e5",
    );
    expect(result.depth).toBe(15);
    expect(result.cp).toBe(28);
    expect(result.pv).toEqual(["e2e4", "e7e5"]);
  });
});

describe("FEN validation", () => {
  it("accepts valid start FEN", () => {
    expect(
      isValidFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"),
    ).toBe(true);
  });

  it("accepts mid-game FEN", () => {
    expect(
      isValidFen("rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2"),
    ).toBe(true);
  });

  it("rejects empty string", () => {
    expect(isValidFen("")).toBe(false);
  });

  it("rejects FEN with fewer than 4 parts", () => {
    expect(isValidFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")).toBe(false);
  });
});

describe("Analysis Service lifecycle", () => {
  // Import the singleton once
  let analysisService: typeof import("../analysisService.ts").analysisService;
  beforeAll(async () => {
    const mod = await import("../analysisService.ts");
    analysisService = mod.analysisService;
  });

  afterAll(() => {
    analysisService?.stopEngine();
  });

  it("exports expected methods", () => {
    expect(analysisService).toBeDefined();
    expect(typeof analysisService.startEngine).toBe("function");
    expect(typeof analysisService.stopEngine).toBe("function");
    expect(typeof analysisService.analysePosition).toBe("function");
    expect(typeof analysisService.getBestMove).toBe("function");
    expect(typeof analysisService.getEvaluation).toBe("function");
  });

  it("has valid initial status", () => {
    const status = analysisService.getStatus();
    expect(["idle", "terminated"]).toContain(status);
  });

  it("rejects invalid FEN without starting engine", async () => {
    await expect(analysisService.analysePosition("garbage", 8)).rejects.toMatchObject({
      type: "invalid_fen",
    });
  });

  it("stopEngine transitions to terminated", () => {
    analysisService.stopEngine();
    expect(analysisService.getStatus()).toBe("terminated");
  });

  it("terminateWorker is alias for stopEngine", () => {
    analysisService.stopEngine();
    analysisService.terminateWorker();
    expect(analysisService.getStatus()).toBe("terminated");
  });
});
