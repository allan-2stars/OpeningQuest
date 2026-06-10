import { getAllWorlds, getLessonsByWorld } from "../../lib/repositories/curriculumRepo.ts";
import { getAllLessonProgress } from "../../lib/repositories/lessonProgressRepo.ts";
import { getUserProfile } from "../../lib/repositories/userProfileRepo.ts";
import { getAllAchievements } from "../../lib/repositories/rewardsRepo.ts";
import { getTodayQuestState } from "../../features/quests/dailyQuestService.ts";

const DEFAULT_USER_ID = "user_default";

export type DashboardStats = {
  totalXp: number;
  totalKeys: number;

  lessonsCompleted: number;
  lessonsUnlocked: number;
  lessonsTotal: number;

  reviewsCompleted: number;

  perfectRuns: number;

  masteryAverage: number;

  dueReviews: number;

  dailyQuestsCompletedToday: number;

  worldsCompleted: number;
  worldsTotal: number;
};

export type WorldProgress = {
  worldId: string;
  worldName: string;
  lessonsCompleted: number;
  lessonsTotal: number;
  completionPercent: number;
  averageMastery: number;
};

export type RecentActivityItem = {
  id: string;
  type: "lesson_completed" | "review_completed" | "quest_completed" | "achievement_unlocked";
  title: string;
  timestamp: string;
};

function roundOneDecimal(n: number): number {
  return Math.round(n * 10) / 10;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const profile = await getUserProfile(DEFAULT_USER_ID);
  const progressEntries = await getAllLessonProgress();
  const worlds = await getAllWorlds();
  const questState = await getTodayQuestState();

  const totalXp = profile?.totalXp ?? 0;
  const totalKeys = profile?.keys ?? 0;

  // Lessons: completed means attempted or mastered
  const lessonsCompleted = progressEntries.filter(
    (p) => p.attempts > 0 || p.perfectRuns > 0,
  ).length;
  const lessonsUnlocked = progressEntries.filter(
    (p) => p.status !== "locked",
  ).length;
  const lessonsTotal = progressEntries.length;

  // Reviews: mode === "review" in progress — approximate from
  // mastered lessons with review_due status
  const dueReviews = progressEntries.filter(
    (p) => p.status === "review_due",
  ).length;

  // Reviews completed: trainingSessions table not directly accessible
  // from repos. Use attempt count on reviewed lessons.
  const reviewsCompleted = progressEntries.reduce(
    (acc, p) => acc + (p.attempts > 0 ? 1 : 0),
    0,
  );

  // Perfect runs
  const perfectRuns = progressEntries.reduce(
    (acc, p) => acc + p.perfectRuns,
    0,
  );

  // Average mastery across all lessons
  const masteryAverage = lessonsTotal > 0
    ? roundOneDecimal(progressEntries.reduce((acc, p) => acc + p.masteryLevel, 0) / lessonsTotal)
    : 0;

  // Worlds
  const worldsTotal = worlds.length;
  let worldsCompleted = 0;
  for (const world of worlds) {
    const lessons = await getLessonsByWorld(world.id);
    const allMastered = lessons.length > 0 && lessons.every((l) => {
      const p = progressEntries.find((pr) => pr.lessonId === l.id);
      return p && p.masteryLevel >= 4;
    });
    if (allMastered) worldsCompleted++;
  }

  // Daily quests
  const dailyQuestsCompletedToday = questState.quests.filter(
    (q) => q.completed,
  ).length;

  return {
    totalXp,
    totalKeys,
    lessonsCompleted,
    lessonsUnlocked,
    lessonsTotal,
    reviewsCompleted,
    perfectRuns,
    masteryAverage,
    dueReviews,
    dailyQuestsCompletedToday,
    worldsCompleted,
    worldsTotal,
  };
}

export async function getWorldProgress(): Promise<WorldProgress[]> {
  const worlds = await getAllWorlds();
  const progressEntries = await getAllLessonProgress();

  const result: WorldProgress[] = [];

  for (const world of worlds) {
    const lessons = await getLessonsByWorld(world.id);
    const lessonsTotal = lessons.length;

    let completed = 0;
    let masterySum = 0;

    for (const lesson of lessons) {
      const p = progressEntries.find((pr) => pr.lessonId === lesson.id);
      if (p) {
        if (p.masteryLevel >= 4) completed++;
        masterySum += p.masteryLevel;
      }
    }

    const completionPercent = lessonsTotal > 0
      ? Math.round((completed / lessonsTotal) * 100)
      : 0;
    const averageMastery = lessonsTotal > 0
      ? roundOneDecimal(masterySum / lessonsTotal)
      : 0;

    result.push({
      worldId: world.id,
      worldName: world.name,
      lessonsCompleted: completed,
      lessonsTotal,
      completionPercent,
      averageMastery,
    });
  }

  return result;
}

export async function getRecentActivity(): Promise<RecentActivityItem[]> {
  const items: RecentActivityItem[] = [];

  // 1. Lesson completions from progress
  const progressEntries = await getAllLessonProgress();
  for (const p of progressEntries) {
    if (p.lastPracticedAt && p.attempts > 0) {
      items.push({
        id: `lesson_${p.lessonId}_${p.lastPracticedAt}`,
        type: "lesson_completed",
        title: p.lessonId,
        timestamp: p.lastPracticedAt,
      });
    }
  }

  // 2. Review completions: same data source, filtered for mastered+reviewed lessons
  for (const p of progressEntries) {
    if (p.masteryLevel >= 4 && p.lastPracticedAt) {
      items.push({
        id: `review_${p.lessonId}_${p.lastPracticedAt}`,
        type: "review_completed",
        title: p.lessonId,
        timestamp: p.lastPracticedAt,
      });
    }
  }

  // 3. Quest completions from daily quest progress
  try {
    const questState = await getTodayQuestState();
    for (const q of questState.quests) {
      if (q.completed && q.completedAt) {
        items.push({
          id: `quest_${q.questId}_${q.completedAt}`,
          type: "quest_completed",
          title: q.title,
          timestamp: q.completedAt,
        });
      }
    }
  } catch {
    // Quests may not be initialized yet — safe to skip
  }

  // 4. Achievement unlocks
  try {
    const achievements = await getAllAchievements();
    for (const a of achievements) {
      if (a.unlockedAt) {
        items.push({
          id: `ach_${a.id}`,
          type: "achievement_unlocked",
          title: a.name,
          timestamp: a.unlockedAt,
        });
      }
    }
  } catch {
    // Safe skip
  }

  // Sort newest first
  items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  // Return latest 20
  return items.slice(0, 20);
}
