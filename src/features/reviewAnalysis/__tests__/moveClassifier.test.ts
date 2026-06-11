import { describe, it, expect } from "vitest";
import { classifyMove } from "../moveClassifier.ts";

describe("classifyMove", () => {
  describe("Rule 1 — Opening move", () => {
    it("classifies expected opening move as SMART_MOVE", () => {
      const result = classifyMove({
        moveSan: "e4",
        expectedMoveSan: "e4",
      });
      expect(result.classification).toBe("SMART_MOVE");
      expect(result.reasonCode).toBe("OPENING_MOVE");
    });

    it("rule 1 takes priority over other hints", () => {
      const result = classifyMove({
        moveSan: "e4",
        expectedMoveSan: "e4",
        bestMoveSan: "d4",
        openingExitDetected: false,
      });
      expect(result.classification).toBe("SMART_MOVE");
      expect(result.reasonCode).toBe("OPENING_MOVE");
    });
  });

  describe("Rule 2 — Best move", () => {
    it("classifies engine best move as SMART_MOVE", () => {
      const result = classifyMove({
        moveSan: "d4",
        bestMoveSan: "d4",
      });
      expect(result.classification).toBe("SMART_MOVE");
      expect(result.reasonCode).toBe("BEST_MOVE");
    });

    it("rule 2 fires when expectedMoveSan is undefined", () => {
      const result = classifyMove({
        moveSan: "Nf3",
        bestMoveSan: "Nf3",
      });
      expect(result.classification).toBe("SMART_MOVE");
    });
  });

  describe("Rule 3 — Opening exit", () => {
    it("classifies opening exit as WATCH_OUT", () => {
      const result = classifyMove({
        moveSan: "a4",
        openingExitDetected: true,
      });
      expect(result.classification).toBe("WATCH_OUT");
      expect(result.reasonCode).toBe("OPENING_EXIT");
    });

    it("rule 3 fires even with evaluation data present", () => {
      const result = classifyMove({
        moveSan: "a4",
        openingExitDetected: true,
        evalDrop: 40,
      });
      expect(result.classification).toBe("WATCH_OUT");
      expect(result.reasonCode).toBe("OPENING_EXIT");
    });
  });

  describe("Rule 4 — Large eval drop (>= 150)", () => {
    it("classifies large eval drop as OOPS", () => {
      const result = classifyMove({
        moveSan: "Qh5",
        evalDrop: 200,
      });
      expect(result.classification).toBe("OOPS");
      expect(result.reasonCode).toBe("LARGE_EVAL_DROP");
    });

    it("drop of exactly 150 qualifies", () => {
      const result = classifyMove({
        moveSan: "Bxh7",
        evalDrop: 150,
      });
      expect(result.classification).toBe("OOPS");
      expect(result.reasonCode).toBe("LARGE_EVAL_DROP");
    });

    it("drop of 200 qualifies", () => {
      const result = classifyMove({
        moveSan: "Ng5",
        evalDrop: 200,
      });
      expect(result.classification).toBe("OOPS");
    });
  });

  describe("Rule 5 — Moderate eval drop (>= 50)", () => {
    it("classifies moderate eval drop as WATCH_OUT", () => {
      const result = classifyMove({
        moveSan: "Bb5",
        evalDrop: 60,
      });
      expect(result.classification).toBe("WATCH_OUT");
      expect(result.reasonCode).toBe("EVAL_DROP");
    });

    it("drop of exactly 50 qualifies", () => {
      const result = classifyMove({
        moveSan: "Nc3",
        evalDrop: 50,
      });
      expect(result.classification).toBe("WATCH_OUT");
      expect(result.reasonCode).toBe("EVAL_DROP");
    });

    it("drop of 120 qualifies (not large enough for OOPS)", () => {
      const result = classifyMove({
        moveSan: "Be3",
        evalDrop: 120,
      });
      expect(result.classification).toBe("WATCH_OUT");
      expect(result.reasonCode).toBe("EVAL_DROP");
    });
  });

  describe("Rule 6 — Good move (< 30 drop)", () => {
    it("classifies small eval drop as GOOD_MOVE", () => {
      const result = classifyMove({
        moveSan: "O-O",
        evalDrop: 15,
      });
      expect(result.classification).toBe("GOOD_MOVE");
      expect(result.reasonCode).toBe("SOLID_MOVE");
    });

    it("drop of 0 qualifies", () => {
      const result = classifyMove({
        moveSan: "d5",
        evalDrop: 0,
      });
      expect(result.classification).toBe("GOOD_MOVE");
    });

    it("drop of 29 qualifies", () => {
      const result = classifyMove({
        moveSan: "c5",
        evalDrop: 29,
      });
      expect(result.classification).toBe("GOOD_MOVE");
    });

    it("drop of 30 does NOT qualify — falls to SAFE_MOVE", () => {
      const result = classifyMove({
        moveSan: "h3",
        evalDrop: 30,
      });
      expect(result.classification).toBe("SAFE_MOVE");
    });
  });

  describe("Rule 7 — Fallback", () => {
    it("returns SAFE_MOVE when no other rule matches", () => {
      const result = classifyMove({
        moveSan: "a3",
      });
      expect(result.classification).toBe("SAFE_MOVE");
      expect(result.reasonCode).toBe("SAFE_MOVE");
    });

    it("returns SAFE_MOVE for eval drop between 30 and 49", () => {
      const result = classifyMove({
        moveSan: "h3",
        evalDrop: 35,
      });
      expect(result.classification).toBe("SAFE_MOVE");
      expect(result.reasonCode).toBe("SAFE_MOVE");
    });

    it("drop of 49 is still SAFE_MOVE (upper bound of gray zone)", () => {
      const result = classifyMove({
        moveSan: "h3",
        evalDrop: 49,
      });
      expect(result.classification).toBe("SAFE_MOVE");
    });
  });

  describe("Priority chain verification", () => {
    it("Rule 1 > Rule 2: expected move wins over best move", () => {
      const result = classifyMove({
        moveSan: "e4",
        expectedMoveSan: "e4",
        bestMoveSan: "e4",
      });
      expect(result.classification).toBe("SMART_MOVE");
      expect(result.reasonCode).toBe("OPENING_MOVE");
    });

    it("Rule 1 > Rule 3: opening move wins over exit flag", () => {
      const result = classifyMove({
        moveSan: "e4",
        expectedMoveSan: "e4",
        openingExitDetected: true,
      });
      expect(result.classification).toBe("SMART_MOVE");
      expect(result.reasonCode).toBe("OPENING_MOVE");
    });

    it("Rule 1 > Rule 4: opening move wins over large eval drop", () => {
      const result = classifyMove({
        moveSan: "e4",
        expectedMoveSan: "e4",
        evalDrop: 300,
      });
      expect(result.classification).toBe("SMART_MOVE");
      expect(result.reasonCode).toBe("OPENING_MOVE");
    });

    it("Rule 2 > Rule 3: best move wins over opening exit", () => {
      const result = classifyMove({
        moveSan: "Nf3",
        bestMoveSan: "Nf3",
        openingExitDetected: true,
      });
      expect(result.classification).toBe("SMART_MOVE");
      expect(result.reasonCode).toBe("BEST_MOVE");
    });

    it("Rule 2 > Rule 4: best move wins over large eval drop", () => {
      const result = classifyMove({
        moveSan: "Nf3",
        bestMoveSan: "Nf3",
        evalDrop: 300,
      });
      expect(result.classification).toBe("SMART_MOVE");
      expect(result.reasonCode).toBe("BEST_MOVE");
    });

    it("Rule 3 > Rule 4: opening exit wins over eval drop", () => {
      const result = classifyMove({
        moveSan: "a4",
        openingExitDetected: true,
        evalDrop: 200,
      });
      expect(result.classification).toBe("WATCH_OUT");
      expect(result.reasonCode).toBe("OPENING_EXIT");
    });
  });
});
