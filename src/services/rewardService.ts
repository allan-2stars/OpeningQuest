import type { TrainingSessionResult } from "../features/training/types.ts";
import type { LessonProgress } from "../types/domain.ts";
import { computeRewardSummary, type RewardSummary } from "./rewardCalculator.ts";
import { getUserProfile, updateUserProfile } from "../lib/repositories/userProfileRepo.ts";
import { getUnlockedAchievements, updateAchievement } from "../lib/repositories/rewardsRepo.ts";
import { nowISO } from "../lib/date.ts";

export type { RewardSummary } from "./rewardCalculator.ts";

const DEFAULT_USER_ID = "user_default";

export async function applyRewards(
  result: TrainingSessionResult,
  oldProgress: LessonProgress,
  newProgress: LessonProgress,
): Promise<RewardSummary> {
  const unlockedAchievements = await getUnlockedAchievements();
  const alreadyUnlockedIds = new Set(unlockedAchievements.map((a) => a.id));

  const summary = computeRewardSummary(
    result,
    oldProgress,
    newProgress,
    alreadyUnlockedIds,
  );

  // Persist XP and keys to user profile
  if (summary.xp > 0 || summary.keys > 0) {
    const profile = await getUserProfile(DEFAULT_USER_ID);
    if (!profile) {
      throw new Error("User profile not found — seed data may not have run");
    }
    await updateUserProfile(DEFAULT_USER_ID, {
      totalXp: profile.totalXp + summary.xp,
      keys: profile.keys + summary.keys,
    });
  }

  // Persist newly unlocked achievements with timestamp
  const now = nowISO();
  for (const achId of summary.unlockedAchievementIds) {
    await updateAchievement(achId, { unlockedAt: now });
  }

  return summary;
}
