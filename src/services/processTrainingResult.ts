import type { TrainingSessionResult } from "../features/training/types.ts";
import type { LessonProgress } from "../types/domain.ts";
import { getLessonProgress, upsertLessonProgress } from "../lib/repositories/lessonProgressRepo.ts";
import { applyTrainingResult } from "./progressionEngine.ts";
import { applyRewards } from "./rewardService.ts";
import type { RewardSummary } from "./rewardCalculator.ts";
import { nowISO } from "../lib/date.ts";

export type ProcessResult = {
  progress: LessonProgress;
  rewardSummary: RewardSummary | null;
  rewardError: string | null;
};

export async function processTrainingResult(
  result: TrainingSessionResult,
): Promise<ProcessResult> {
  if (result.totalUserMoves === 0) {
    // Degenerate lesson — do not persist or update stats; return real stored progress if any
    const existing = await getLessonProgress(result.lessonId);
    return {
      progress: existing ?? makeStubProgress(result.lessonId),
      rewardSummary: null,
      rewardError: null,
    };
  }

  const existing = await getLessonProgress(result.lessonId);
  const oldProgress = existing ?? makeStubProgress(result.lessonId);
  const now = nowISO();
  const updated = applyTrainingResult(oldProgress, result, now);
  await upsertLessonProgress(updated);

  // Apply rewards (best-effort — we report errors rather than swallowing them)
  let rewardSummary: RewardSummary | null = null;
  let rewardError: string | null = null;
  try {
    rewardSummary = await applyRewards(result, oldProgress, updated);
  } catch (e) {
    rewardError = e instanceof Error ? e.message : "Failed to apply rewards";
  }

  return { progress: updated, rewardSummary, rewardError };
}

function makeStubProgress(lessonId: string): LessonProgress {
  return {
    lessonId,
    masteryLevel: 0,
    perfectRuns: 0,
    attempts: 0,
    mistakes: 0,
    status: "available",
    failedReviewCount: 0,
  };
}
