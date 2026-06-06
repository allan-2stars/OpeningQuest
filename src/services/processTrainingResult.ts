import type { TrainingSessionResult } from "../features/training/types.ts";
import type { LessonProgress } from "../types/domain.ts";
import { getLessonProgress, upsertLessonProgress } from "../lib/repositories/lessonProgressRepo.ts";
import { applyTrainingResult } from "./progressionEngine.ts";
import { nowISO } from "../lib/date.ts";

export type ProcessResult = {
  progress: LessonProgress;
};

export async function processTrainingResult(
  result: TrainingSessionResult,
): Promise<ProcessResult> {
  if (result.totalUserMoves === 0) {
    // Degenerate lesson — do not persist or update stats; return real stored progress if any
    const existing = await getLessonProgress(result.lessonId);
    return { progress: existing ?? makeStubProgress(result.lessonId) };
  }

  const existing = await getLessonProgress(result.lessonId);
  const now = nowISO();
  const updated = applyTrainingResult(
    existing ?? makeStubProgress(result.lessonId),
    result,
    now,
  );
  await upsertLessonProgress(updated);
  return { progress: updated };
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
