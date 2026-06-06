import { describe, it, expect } from "vitest";
import {
  computeMasteryLevel,
  applyTrainingResult,
  applyReviewResult,
  canUnlockLesson,
  canUnlockWorld,
  computeNextReviewDate,
  REVIEW_INTERVALS,
} from "../progressionEngine.ts";
import type {
  LessonProgress,
  LessonStatus,
  MasteryLevel,
} from "../../types/domain.ts";
import type { TrainingSessionResult } from "../../features/training/types.ts";

const NOW = "2026-06-06T12:00:00.000Z";

function makeProgress(overrides: Partial<LessonProgress> = {}): LessonProgress {
  return {
    lessonId: "lesson_001",
    masteryLevel: 0 as MasteryLevel,
    perfectRuns: 0,
    attempts: 0,
    mistakes: 0,
    status: "available" as LessonStatus,
    failedReviewCount: 0,
    ...overrides,
  };
}

function makeResult(overrides: Partial<TrainingSessionResult> = {}): TrainingSessionResult {
  return {
    lessonId: "lesson_001",
    mode: "guided",
    completed: true,
    mistakes: 0,
    totalMoves: 7,
    totalUserMoves: 4,
    perfectRun: true,
    history: [],
    ...overrides,
  };
}

describe("computeMasteryLevel", () => {
  it("returns 0 for 0 perfect runs", () => {
    expect(computeMasteryLevel(0)).toBe(0);
  });

  it("returns 1 for 1-3 perfect runs", () => {
    expect(computeMasteryLevel(1)).toBe(1);
    expect(computeMasteryLevel(3)).toBe(1);
  });

  it("returns 2 for 4-6 perfect runs", () => {
    expect(computeMasteryLevel(4)).toBe(2);
    expect(computeMasteryLevel(6)).toBe(2);
  });

  it("returns 3 for 7-9 perfect runs", () => {
    expect(computeMasteryLevel(7)).toBe(3);
    expect(computeMasteryLevel(9)).toBe(3);
  });

  it("returns 4 for 10+ perfect runs", () => {
    expect(computeMasteryLevel(10)).toBe(4);
    expect(computeMasteryLevel(100)).toBe(4);
  });
});

describe("applyTrainingResult", () => {
  it("increments attempts on every call", () => {
    const p = makeProgress();
    const result = applyTrainingResult(p, makeResult(), NOW);
    expect(result.attempts).toBe(1);
  });

  it("increments perfectRuns on perfect completion", () => {
    const p = makeProgress();
    const result = applyTrainingResult(p, makeResult({ perfectRun: true, completed: true }), NOW);
    expect(result.perfectRuns).toBe(1);
    expect(result.status).toBe("learning");
  });

  it("sets status to mastered on 10th perfect run", () => {
    const p = makeProgress({ perfectRuns: 9, masteryLevel: 3 });
    const result = applyTrainingResult(p, makeResult({ perfectRun: true, completed: true }), NOW);
    expect(result.perfectRuns).toBe(10);
    expect(result.masteryLevel).toBe(4);
    expect(result.status).toBe("mastered");
    expect(result.nextReviewAt).toBeDefined();
    expect(result.failedReviewCount).toBe(0);
  });

  it("sets first review date to 1 day from now", () => {
    const p = makeProgress({ perfectRuns: 9, masteryLevel: 3 });
    const result = applyTrainingResult(p, makeResult({ perfectRun: true }), NOW);
    const expectedDate = new Date(NOW);
    expectedDate.setDate(expectedDate.getDate() + 1);
    expect(result.nextReviewAt).toBe(expectedDate.toISOString());
  });

  it("tracks mistakes on non-perfect completion", () => {
    const p = makeProgress();
    const result = applyTrainingResult(p, makeResult({ completed: true, perfectRun: false, mistakes: 3 }), NOW);
    expect(result.mistakes).toBe(3);
    expect(result.perfectRuns).toBe(0);
    expect(result.status).toBe("learning");
  });

  it("tracks mistakes on instinct failure", () => {
    const p = makeProgress();
    const result = applyTrainingResult(p, makeResult({ completed: false, perfectRun: false, mistakes: 1 }), NOW);
    expect(result.mistakes).toBe(1);
    expect(result.perfectRuns).toBe(0);
    expect(result.status).toBe("learning");
  });

  it("handles zero userMoves degenerately", () => {
    const p = makeProgress({ attempts: 5, perfectRuns: 3 });
    const result = applyTrainingResult(p, makeResult({ totalUserMoves: 0, completed: false, perfectRun: false }), NOW);
    // Stats unchanged
    expect(result.attempts).toBe(5);
    expect(result.perfectRuns).toBe(3);
    expect(result.status).toBe("available");
  });

  it("updates lastPracticedAt", () => {
    const p = makeProgress();
    const result = applyTrainingResult(p, makeResult(), NOW);
    expect(result.lastPracticedAt).toBe(NOW);
  });
});

describe("applyReviewResult", () => {
  it("no-ops for non-mastered lessons", () => {
    const p = makeProgress({ masteryLevel: 2, status: "learning" });
    const result = applyReviewResult(p, true, NOW);
    expect(result).toBe(p);
  });

  it("schedules next review on success", () => {
    const p = makeProgress({
      masteryLevel: 4,
      status: "review_due",
      nextReviewAt: "2026-06-06T00:00:00.000Z",
    });
    const result = applyReviewResult(p, true, NOW);
    expect(result.status).toBe("mastered");
    expect(result.failedReviewCount).toBe(0);
    // nextReviewAt should be pushed forward
    expect(result.nextReviewAt).not.toBe(p.nextReviewAt);
  });

  it("increments failedReviewCount on failure", () => {
    const p = makeProgress({ masteryLevel: 4, failedReviewCount: 0 });
    const result = applyReviewResult(p, false, NOW);
    expect(result.failedReviewCount).toBe(1);
  });

  it("decays mastery by 1 after 2 failed reviews", () => {
    const p = makeProgress({ masteryLevel: 4, failedReviewCount: 1, status: "review_due" });
    const result = applyReviewResult(p, false, NOW);
    expect(result.masteryLevel).toBe(3);
    expect(result.failedReviewCount).toBe(0);
    expect(result.status).toBe("learning");
  });

  it("resets failed count after decay", () => {
    const p = makeProgress({ masteryLevel: 4, failedReviewCount: 1 });
    const result = applyReviewResult(p, false, NOW);
    expect(result.failedReviewCount).toBe(0);
  });
});

describe("computeNextReviewDate", () => {
  it("returns 1 day later for interval 0", () => {
    const result = computeNextReviewDate(NOW, 0);
    const expected = new Date(NOW);
    expected.setDate(expected.getDate() + 1);
    expect(result).toBe(expected.toISOString());
  });

  it("returns 365 days later for interval 8", () => {
    const result = computeNextReviewDate(NOW, 8);
    const expected = new Date(NOW);
    expected.setDate(expected.getDate() + 365);
    expect(result).toBe(expected.toISOString());
  });

  it("clamps to max interval", () => {
    const result = computeNextReviewDate(NOW, 999);
    const expected = new Date(NOW);
    expected.setDate(expected.getDate() + 365);
    expect(result).toBe(expected.toISOString());
  });
});

describe("REVIEW_INTERVALS", () => {
  it("has 9 entries matching spec", () => {
    expect(REVIEW_INTERVALS).toEqual([1, 3, 7, 14, 30, 60, 90, 180, 365]);
  });
});

describe("canUnlockLesson", () => {
  it("unlocks when no prerequisites", () => {
    expect(canUnlockLesson(undefined, new Map())).toBe(true);
    expect(canUnlockLesson([], new Map())).toBe(true);
  });

  it("unlocks when all prerequisites are mastered", () => {
    const map = new Map([
      ["a", makeProgress({ lessonId: "a", masteryLevel: 4, status: "mastered" })],
      ["b", makeProgress({ lessonId: "b", masteryLevel: 4, status: "mastered" })],
    ]);
    expect(canUnlockLesson(["a", "b"], map)).toBe(true);
  });

  it("blocks when any prerequisite is not mastered", () => {
    const map = new Map([
      ["a", makeProgress({ lessonId: "a", masteryLevel: 4, status: "mastered" })],
      ["b", makeProgress({ lessonId: "b", masteryLevel: 1, status: "learning" })],
    ]);
    expect(canUnlockLesson(["a", "b"], map)).toBe(false);
  });

  it("blocks when prerequisite is missing from map", () => {
    const map = new Map([
      ["a", makeProgress({ lessonId: "a", masteryLevel: 4 })],
    ]);
    expect(canUnlockLesson(["a", "b"], map)).toBe(false);
  });
});

describe("canUnlockWorld", () => {
  it("unlocks when all lessons in prior world are mastered or review_due", () => {
    const map = new Map([
      ["a", makeProgress({ lessonId: "a", masteryLevel: 4, status: "mastered" })],
      ["b", makeProgress({ lessonId: "b", masteryLevel: 4, status: "review_due" })],
    ]);
    expect(canUnlockWorld(["a", "b"], map)).toBe(true);
  });

  it("blocks when any lesson is not complete", () => {
    const map = new Map([
      ["a", makeProgress({ lessonId: "a", masteryLevel: 4, status: "mastered" })],
      ["b", makeProgress({ lessonId: "b", masteryLevel: 1, status: "learning" })],
    ]);
    expect(canUnlockWorld(["a", "b"], map)).toBe(false);
  });
});
