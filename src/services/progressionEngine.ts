import type { LessonProgress, LessonStatus, MasteryLevel } from "../types/domain.ts";
import type { TrainingSessionResult } from "../features/training/types.ts";
import { daysFromNow } from "../lib/date.ts";

/** Days to next review after mastery: 1, 3, 7, 14, 30, 60, 90, 180, 365 */
export const REVIEW_INTERVALS: readonly number[] = [1, 3, 7, 14, 30, 60, 90, 180, 365];

export function isReviewDue(
  nextReviewAt: string | undefined,
  now: string,
): boolean {
  if (!nextReviewAt) return false;
  return nextReviewAt <= now;
}

export function computeMasteryLevel(perfectRuns: number): MasteryLevel {
  if (perfectRuns < 1) return 0;
  if (perfectRuns < 4) return 1;
  if (perfectRuns < 7) return 2;
  if (perfectRuns < 10) return 3;
  return 4;
}

export function computeNextReviewDate(
  fromISO: string,
  reviewIndex: number,
): string {
  const clamped = Math.max(0, Math.min(reviewIndex, REVIEW_INTERVALS.length - 1));
  const from = new Date(fromISO);
  from.setDate(from.getDate() + REVIEW_INTERVALS[clamped]);
  return from.toISOString();
}

export function deriveLessonStatus(
  progress: LessonProgress,
  nowISO: string,
): LessonStatus {
  if (progress.masteryLevel >= 4) {
    if (isReviewDue(progress.nextReviewAt, nowISO)) return "review_due";
    return "mastered";
  }

  if (progress.perfectRuns > 0 || progress.attempts > 0) {
    return "learning";
  }

  return progress.status;
}

/**
 * Process a completed or failed training session result against existing lesson progress.
 * Returns updated progress (not persisted — caller handles storage).
 */
export function applyTrainingResult(
  progress: LessonProgress,
  result: TrainingSessionResult,
  nowISO: string,
): LessonProgress {
  if (result.totalUserMoves === 0) {
    // Degenerate lesson with no user moves — mark as unavailable, don't update stats
    return { ...progress, status: "available" };
  }

  const updated = {
    ...progress,
    attempts: progress.attempts + 1,
    lastPracticedAt: nowISO,
  };

  if (result.completed && result.perfectRun) {
    const newPerfectRuns = progress.perfectRuns + 1;
    const masteryLevel = computeMasteryLevel(newPerfectRuns);
    const wasJustMastered = masteryLevel >= 4 && progress.masteryLevel < 4;

    updated.perfectRuns = newPerfectRuns;
    updated.masteryLevel = masteryLevel;

    if (wasJustMastered) {
      updated.status = "mastered";
      updated.nextReviewAt = computeNextReviewDate(nowISO, 0);
      updated.failedReviewCount = 0;
    } else {
      updated.status = progress.masteryLevel >= 4 ? "mastered" : "learning";
    }
  } else if (result.completed && !result.perfectRun) {
    // Completed with mistakes — still counts as an attempt but not a perfect run
    updated.status = progress.masteryLevel >= 4 ? "mastered" : "learning";
    updated.mistakes = progress.mistakes + result.mistakes;
  } else {
    // Failed (instinct) — just record the mistakes
    updated.mistakes = progress.mistakes + result.mistakes;
    updated.status = progress.masteryLevel >= 4 ? "mastered" : "learning";
  }

  return updated;
}

/**
 * Apply a review outcome. Success schedules next review, failure increments
 * the failed count. 2 failed reviews reduce mastery by 1 level and reset
 * the failed count.
 */
export function applyReviewResult(
  progress: LessonProgress,
  success: boolean,
  nowISO: string,
): LessonProgress {
  if (progress.masteryLevel < 4) return progress;

  if (success) {
    const currentInterval = progress.nextReviewAt
      ? Math.max(0, REVIEW_INTERVALS.findIndex((d) => daysFromNow(d) >= (progress.nextReviewAt ?? "")) ?? 0)
      : 0;
    const nextIndex = Math.min(currentInterval + 1, REVIEW_INTERVALS.length - 1);
    return {
      ...progress,
      status: "mastered",
      nextReviewAt: computeNextReviewDate(nowISO, nextIndex),
      failedReviewCount: 0,
      lastPracticedAt: nowISO,
    };
  }

  // Failed review
  const newFailedCount = progress.failedReviewCount + 1;
  if (newFailedCount >= 2) {
    const decayedLevel = Math.max(0, progress.masteryLevel - 1) as MasteryLevel;
    return {
      ...progress,
      masteryLevel: decayedLevel,
      failedReviewCount: 0,
      status: decayedLevel >= 4 ? "mastered" : "learning",
      lastPracticedAt: nowISO,
    };
  }

  return {
    ...progress,
    failedReviewCount: newFailedCount,
    lastPracticedAt: nowISO,
  };
}

/**
 * Check whether `lesson` can be unlocked given a map of lessonId → completed status.
 * A lesson is unlockable when all of its prerequisite lessons have masteryLevel >= 4.
 */
export function canUnlockLesson(
  requiredLessonIds: string[] | undefined,
  progressMap: Map<string, LessonProgress>,
): boolean {
  if (!requiredLessonIds || requiredLessonIds.length === 0) return true;
  return requiredLessonIds.every((id) => {
    const p = progressMap.get(id);
    return p && p.masteryLevel >= 4;
  });
}

/**
 * Check whether all lessons in the previous world are complete.
 * Uses masteryLevel >= 4 as the canonical completion signal.
 */
export function canUnlockWorld(
  previousWorldLessonIds: string[],
  progressMap: Map<string, LessonProgress>,
): boolean {
  return previousWorldLessonIds.every((id) => {
    const p = progressMap.get(id);
    return p && p.masteryLevel >= 4;
  });
}
