import { describe, it, expect } from "vitest";
import {
  computeAchievementTransitions,
  computeRewardSummary,
  XP_PER_CORRECT_MOVE,
  XP_PERFECT_RUN,
  XP_MASTER_LESSON,
  KEY_MASTER_LESSON,
} from "../rewardCalculator.ts";
import type {
  LessonProgress,
  LessonStatus,
  MasteryLevel,
} from "../../types/domain.ts";
import type { TrainingSessionResult } from "../../features/training/types.ts";

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
    history: [
      { type: "accepted", legal: true, correct: true, san: "e4", message: "Correct!" },
      { type: "opponent", legal: true, correct: true, san: "e5", message: "Opponent played e5" },
      { type: "accepted", legal: true, correct: true, san: "Nf3", message: "Correct!" },
      { type: "opponent", legal: true, correct: true, san: "Nc6", message: "Opponent played Nc6" },
      { type: "accepted", legal: true, correct: true, san: "Bc4", message: "Correct!" },
      { type: "opponent", legal: true, correct: true, san: "Bc5", message: "Opponent played Bc5" },
      { type: "accepted", legal: true, correct: true, san: "c3", message: "Correct!" },
    ],
    ...overrides,
  };
}

describe("computeAchievementTransitions", () => {
  it("unlocks first-lesson achievement", () => {
    const old = makeProgress({ attempts: 0 });
    const newer = makeProgress({ attempts: 1 });
    const ids = computeAchievementTransitions(old, newer, new Set());
    expect(ids).toContain("ach_first_lesson");
  });

  it("unlocks first-perfect-run achievement", () => {
    const old = makeProgress({ perfectRuns: 0 });
    const newer = makeProgress({ perfectRuns: 1 });
    const ids = computeAchievementTransitions(old, newer, new Set());
    expect(ids).toContain("ach_first_perfect_run");
  });

  it("unlocks first-mastered achievement", () => {
    const old = makeProgress({ masteryLevel: 3, perfectRuns: 9 });
    const newer = makeProgress({ masteryLevel: 4, perfectRuns: 10 });
    const ids = computeAchievementTransitions(old, newer, new Set());
    expect(ids).toContain("ach_first_mastered");
  });

  it("unlocks perfect-10 achievement", () => {
    const old = makeProgress({ perfectRuns: 9, masteryLevel: 3 });
    const newer = makeProgress({ perfectRuns: 10, masteryLevel: 4 });
    const ids = computeAchievementTransitions(old, newer, new Set());
    expect(ids).toContain("ach_perfect_10");
  });

  it("does not re-unlock already unlocked achievements", () => {
    const old = makeProgress({ attempts: 0 });
    const newer = makeProgress({ attempts: 1 });
    const ids = computeAchievementTransitions(old, newer, new Set(["ach_first_lesson"]));
    expect(ids).not.toContain("ach_first_lesson");
  });

  it("returns empty for no progress change", () => {
    const p = makeProgress({ attempts: 5, perfectRuns: 2 });
    const ids = computeAchievementTransitions(p, p, new Set());
    expect(ids).toHaveLength(0);
  });

  it("returns multiple achievements when multiple thresholds cross", () => {
    const old = makeProgress({ attempts: 0, perfectRuns: 0, masteryLevel: 0 });
    const newer = makeProgress({ attempts: 1, perfectRuns: 1, masteryLevel: 4, status: "mastered" });
    const ids = computeAchievementTransitions(old, newer, new Set());
    expect(ids).toContain("ach_first_lesson");
    expect(ids).toContain("ach_first_perfect_run");
    expect(ids).toContain("ach_first_mastered");
  });
});

describe("computeRewardSummary", () => {
  it("returns zero rewards for degenerate session", () => {
    const result = makeResult({ totalUserMoves: 0 });
    const old = makeProgress();
    const summary = computeRewardSummary(result, old, old, new Set());
    expect(summary.xp).toBe(0);
    expect(summary.keys).toBe(0);
    expect(summary.unlockedAchievementIds).toHaveLength(0);
  });

  it("awards XP and keys for first-time mastery", () => {
    const result = makeResult({ perfectRun: true });
    const old = makeProgress({ perfectRuns: 9, masteryLevel: 3 });
    const newer = makeProgress({ perfectRuns: 10, masteryLevel: 4, status: "mastered" });
    const summary = computeRewardSummary(result, old, newer, new Set());
    const expectedXp = 4 * XP_PER_CORRECT_MOVE + XP_PERFECT_RUN + XP_MASTER_LESSON;
    expect(summary.xp).toBe(expectedXp);
    expect(summary.keys).toBe(KEY_MASTER_LESSON);
  });

  it("does not award mastery bonus if already mastered before session", () => {
    const result = makeResult({ perfectRun: true });
    const old = makeProgress({ perfectRuns: 11, masteryLevel: 4, status: "mastered" });
    const newer = makeProgress({ perfectRuns: 12, masteryLevel: 4, status: "mastered" });
    const summary = computeRewardSummary(result, old, newer, new Set());
    const expectedXp = 4 * XP_PER_CORRECT_MOVE + XP_PERFECT_RUN;
    expect(summary.xp).toBe(expectedXp);
    expect(summary.keys).toBe(0);
  });

  it("includes achievement IDs when achievements unlock", () => {
    const result = makeResult({ perfectRun: true });
    const old = makeProgress({ attempts: 0, perfectRuns: 0, masteryLevel: 0 });
    const newer = makeProgress({ attempts: 1, perfectRuns: 10, masteryLevel: 4, status: "mastered" });
    const summary = computeRewardSummary(result, old, newer, new Set());
    expect(summary.unlockedAchievementIds.length).toBeGreaterThanOrEqual(3);
  });

  it("respects alreadyUnlockedAchievementIds", () => {
    const result = makeResult({ perfectRun: true });
    const old = makeProgress({ attempts: 0, perfectRuns: 0, masteryLevel: 0 });
    const newer = makeProgress({ attempts: 1, perfectRuns: 10, masteryLevel: 4, status: "mastered" });
    const summary = computeRewardSummary(result, old, newer, new Set([
      "ach_first_lesson",
      "ach_first_perfect_run",
      "ach_first_mastered",
      "ach_perfect_10",
    ]));
    expect(summary.unlockedAchievementIds).toHaveLength(0);
  });
});
