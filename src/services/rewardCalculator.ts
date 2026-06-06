import type { LessonProgress } from "../types/domain.ts";
import type { TrainingSessionResult } from "../features/training/types.ts";

/** Summary of rewards earned from a single training session. */
export type RewardSummary = {
  /** XP gained this session */
  xp: number;
  /** Keys gained this session */
  keys: number;
  /** IDs of achievements newly unlocked this session */
  unlockedAchievementIds: string[];
  /** IDs of cosmetic items (skins/themes) newly unlocked this session */
  unlockedCosmeticIds: string[];
};

/** XP earned for each accepted (correct) user move */
export const XP_PER_CORRECT_MOVE = 1;
/** XP bonus for completing a session with no mistakes */
export const XP_PERFECT_RUN = 25;
/** XP bonus when a lesson reaches masteryLevel >= 4 for the first time */
export const XP_MASTER_LESSON = 100;
/** XP bonus for passing a scheduled review */
export const XP_REVIEW_SUCCESS = 50;
/** XP bonus for defeating a boss */
export const XP_BOSS_VICTORY = 250;
/** XP bonus for completing all lessons in a world */
export const XP_WORLD_COMPLETION = 500;

/** Keys awarded when a lesson reaches masteryLevel >= 4 for the first time */
export const KEY_MASTER_LESSON = 1;
/** Keys awarded for defeating a boss */
export const KEY_BOSS_VICTORY = 3;
/** Keys awarded for completing all lessons in a world */
export const KEY_WORLD_COMPLETION = 5;

const ACH_FIRST_LESSON = "ach_first_lesson";
const ACH_FIRST_PERFECT_RUN = "ach_first_perfect_run";
const ACH_FIRST_MASTERED = "ach_first_mastered";
const ACH_PERFECT_10 = "ach_perfect_10";

/**
 * Compute which achievements should unlock given the old and new progress state.
 * Each achievement only fires once — it is the caller's responsibility to
 * check whether it was already unlocked in the DB before persisting.
 */
export function computeAchievementTransitions(
  oldProgress: LessonProgress,
  newProgress: LessonProgress,
  alreadyUnlockedIds: Set<string>,
): string[] {
  const newlyUnlocked: string[] = [];

  // First lesson completed (first attempt)
  if (
    oldProgress.attempts === 0 &&
    newProgress.attempts >= 1 &&
    !alreadyUnlockedIds.has(ACH_FIRST_LESSON)
  ) {
    newlyUnlocked.push(ACH_FIRST_LESSON);
  }

  // First perfect run
  if (
    oldProgress.perfectRuns === 0 &&
    newProgress.perfectRuns >= 1 &&
    !alreadyUnlockedIds.has(ACH_FIRST_PERFECT_RUN)
  ) {
    newlyUnlocked.push(ACH_FIRST_PERFECT_RUN);
  }

  // First mastered lesson
  if (
    oldProgress.masteryLevel < 4 &&
    newProgress.masteryLevel >= 4 &&
    !alreadyUnlockedIds.has(ACH_FIRST_MASTERED)
  ) {
    newlyUnlocked.push(ACH_FIRST_MASTERED);
  }

  // 10 perfect runs (cumulative)
  if (
    oldProgress.perfectRuns < 10 &&
    newProgress.perfectRuns >= 10 &&
    !alreadyUnlockedIds.has(ACH_PERFECT_10)
  ) {
    newlyUnlocked.push(ACH_PERFECT_10);
  }

  return newlyUnlocked;
}

/**
 * Compute the full reward summary for a completed training session.
 * Compares old and new progress to determine what changed.
 * This is the canonical entry point for reward calculation — it handles
 * per-move XP, perfect-run bonuses, first-time mastery XP/keys, and
 * achievement transitions in a single pass.
 */
export function computeRewardSummary(
  result: TrainingSessionResult,
  oldProgress: LessonProgress,
  newProgress: LessonProgress,
  alreadyUnlockedAchievementIds: Set<string>,
): RewardSummary {
  let xp = 0;
  let keys = 0;
  const unlockedAchievementIds: string[] = [];
  const unlockedCosmeticIds: string[] = [];

  if (result.totalUserMoves === 0) {
    return { xp: 0, keys: 0, unlockedAchievementIds: [], unlockedCosmeticIds: [] };
  }

  // XP from correct moves
  const correctMoves = result.history.filter(
    (f) => f.type === "accepted" && f.correct,
  ).length;
  xp += correctMoves * XP_PER_CORRECT_MOVE;

  // XP from perfect run
  if (result.completed && result.perfectRun) {
    xp += XP_PERFECT_RUN;
  }

  // XP + Keys from first-time mastery
  const wasJustMastered =
    oldProgress.masteryLevel < 4 && newProgress.masteryLevel >= 4;
  if (wasJustMastered) {
    xp += XP_MASTER_LESSON;
    keys += KEY_MASTER_LESSON;
  }

  // Achievements
  const achievementTransitions = computeAchievementTransitions(
    oldProgress,
    newProgress,
    alreadyUnlockedAchievementIds,
  );
  unlockedAchievementIds.push(...achievementTransitions);

  return { xp, keys, unlockedAchievementIds, unlockedCosmeticIds };
}
