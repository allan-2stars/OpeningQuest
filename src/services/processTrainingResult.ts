import type { TrainingSessionResult } from "../features/training/types.ts";
import type { LessonProgress } from "../types/domain.ts";
import { getLessonProgress, upsertLessonProgress } from "../lib/repositories/lessonProgressRepo.ts";
import { applyTrainingResult, applyReviewResult } from "./progressionEngine.ts";
import { applyRewards } from "./rewardService.ts";
import { XP_REVIEW_SUCCESS } from "./rewardCalculator.ts";
import type { RewardSummary } from "./rewardCalculator.ts";
import { recordQuestEvent } from "../features/quests/dailyQuestService.ts";
import { nowISO } from "../lib/date.ts";
import { evaluateOpeningLine } from "../features/openings/openingLineTracker.ts";
import {
  buildSessionResult,
  saveOpeningSessionResult,
} from "../features/openings/openingSessionRepo.ts";
import { getLesson } from "../lib/repositories/curriculumRepo.ts";
import { getOpeningLine } from "../lib/repositories/curriculumRepo.ts";

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
  const updated =
    result.mode === "review"
      ? applyReviewResult(oldProgress, result.completed, now)
      : applyTrainingResult(oldProgress, result, now);
  await upsertLessonProgress(updated);

  // Apply rewards (best-effort — we report errors rather than swallowing them)
  let rewardSummary: RewardSummary | null = null;
  let rewardError: string | null = null;
  try {
    rewardSummary = await applyRewards(result, oldProgress, updated);
  } catch (e) {
    rewardError = e instanceof Error ? e.message : "Failed to apply rewards";
  }

  // Add review-session XP bonus on top of regular session rewards
  if (result.mode === "review" && result.completed && rewardSummary) {
    rewardSummary = { ...rewardSummary, xp: rewardSummary.xp + XP_REVIEW_SUCCESS };
  }

  // Record daily quest events (best-effort — don't let quest failures block progression)
  try {
    if (result.completed) {
      if (result.mode === "review") {
        await recordQuestEvent({ type: "review_completed" });
      } else {
        await recordQuestEvent({ type: "new_lesson_practiced" });
      }
    }
    if (rewardSummary && rewardSummary.xp > 0) {
      await recordQuestEvent({ type: "xp_earned", amount: rewardSummary.xp });
    }
  } catch {
    // Quest event recording is best-effort — progression continues even if quests fail
  }

  // Record opening exit tracking for completed sessions (best-effort)
  try {
    const lesson = await getLesson(result.lessonId);
    const line = lesson ? await getOpeningLine(lesson.lineId) : undefined;

    if (lesson && line) {
      // Extract only the user's accepted moves from history
      const userMoves = result.history
        .filter((h) => h.type === "accepted" || h.type === "wrong")
        .filter((h) => h.correct)
        .map((h) => h.san);

      const status = evaluateOpeningLine(
        result.lessonId,
        line.sanMoves,
        userMoves,
      );

      const sessionResult = buildSessionResult(
        result.lessonId,
        result.completed,
        status.exited,
        status.exitPly,
        status.exitMoveSan,
        status.expectedMoveSan,
      );
      await saveOpeningSessionResult(sessionResult);
    }
  } catch {
    // Best-effort — session tracking failure must not block progression
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
