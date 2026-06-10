import { getAllWorlds, getLessonsByWorld, getLessons } from "../../lib/repositories/curriculumRepo.ts";
import { getAllLessonProgress } from "../../lib/repositories/lessonProgressRepo.ts";
import { getUserProfile } from "../../lib/repositories/userProfileRepo.ts";
import { getAllAchievements } from "../../lib/repositories/rewardsRepo.ts";
import { getTodayQuestStateReadOnly } from "../../features/quests/dailyQuestService.ts";

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
  // Read-only: does not create quest rows as a side effect
  const questState = await getTodayQuestStateReadOnly();

  const totalXp = profile?.totalXp ?? 0;
  const totalKeys = profile?.keys ?? 0;

  // Completed = player has gained at least one mastery level (not just failed attempts)
  const lessonsCompleted = progressEntries.filter(
    (p) => p.masteryLevel >= 1,
  ).length;
  const lessonsUnlocked = progressEntries.filter(
    (p) => p.status !== "locked",
  ).length;
  const lessonsTotal = progressEntries.length;

  const dueReviews = progressEntries.filter(
    (p) => p.status === "review_due",
  ).length;

  // Approximate: lessons that have entered the spaced-repetition review cycle
  const reviewsCompleted = progressEntries.filter(
    (p) => p.masteryLevel >= 4,
  ).length;

  const perfectRuns = progressEntries.reduce(
    (acc, p) => acc + p.perfectRuns,
    0,
  );

  const masteryAverage = lessonsTotal > 0
    ? roundOneDecimal(progressEntries.reduce((acc, p) => acc + p.masteryLevel, 0) / lessonsTotal)
    : 0;

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

  const dailyQuestsCompletedToday = questState?.quests.filter(
    (q) => q.completed,
  ).length ?? 0;

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

  // 1. Lesson and review completions — one entry per lesson (no duplicates)
  const progressEntries = await getAllLessonProgress();
  const activeLessons = progressEntries.filter(
    (p) => p.lastPracticedAt && p.masteryLevel >= 1,
  );

  if (activeLessons.length > 0) {
    const fetchedLessons = await getLessons(activeLessons.map((p) => p.lessonId));
    const titleById = new Map(fetchedLessons.map((l) => [l.id, l.title]));

    for (const p of activeLessons) {
      const title = titleById.get(p.lessonId) ?? p.lessonId;
      // Mastered lessons are in the review cycle → review_completed
      // In-progress lessons → lesson_completed
      const type: RecentActivityItem["type"] =
        p.masteryLevel >= 4 ? "review_completed" : "lesson_completed";
      items.push({
        id: `${type}_${p.lessonId}_${p.lastPracticedAt}`,
        type,
        title,
        timestamp: p.lastPracticedAt!,
      });
    }
  }

  // 2. Quest completions (read-only — does not create quest rows)
  try {
    const questState = await getTodayQuestStateReadOnly();
    if (questState) {
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
    }
  } catch {
    // Quests may not be initialized yet — safe to skip
  }

  // 3. Achievement unlocks
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

  items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return items.slice(0, 20);
}
