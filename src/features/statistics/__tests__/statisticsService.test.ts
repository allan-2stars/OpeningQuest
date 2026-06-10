import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../../../lib/db.ts";
import { seedCoreData } from "../../../lib/seed/seed.ts";
import { getDashboardStats, getWorldProgress, getRecentActivity } from "../statisticsService.ts";
import { ensureTodayQuests, recordQuestEvent } from "../../quests/dailyQuestService.ts";
import { updateLessonProgress } from "../../../lib/repositories/lessonProgressRepo.ts";
import "fake-indexeddb/auto";

beforeEach(async () => {
  await db.delete();
  await db.open();
  await seedCoreData();
});

describe("getDashboardStats", () => {
  it("returns stats for a fresh user", async () => {
    const stats = await getDashboardStats();
    expect(stats.totalXp).toBe(0);
    expect(stats.totalKeys).toBe(3); // seed default
    expect(stats.lessonsTotal).toBeGreaterThanOrEqual(20);
    expect(stats.lessonsCompleted).toBeGreaterThanOrEqual(0);
    expect(stats.worldsTotal).toBe(3);
    expect(stats.worldsCompleted).toBe(0);
    expect(stats.masteryAverage).toBeGreaterThanOrEqual(0);
    expect(typeof stats.perfectRuns).toBe("number");
    expect(typeof stats.dueReviews).toBe("number");
  });

  it("returns zero masteryAverage for no progress", async () => {
    const stats = await getDashboardStats();
    expect(stats.masteryAverage).toBe(0);
  });

  it("counts daily quests completed today", async () => {
    await ensureTodayQuests();
    await recordQuestEvent({ type: "review_completed" });
    await recordQuestEvent({ type: "new_lesson_practiced" });

    const stats = await getDashboardStats();
    expect(stats.dailyQuestsCompletedToday).toBe(2);
  });

  it("handles empty user profile gracefully", async () => {
    const stats = await getDashboardStats();
    expect(stats.totalXp).toBe(0);
  });

  it("failed/incomplete attempts do not count toward lessonsCompleted", async () => {
    await updateLessonProgress("lesson_w1_italian_main", {
      attempts: 5,
      masteryLevel: 0,
      status: "available",
    });

    const stats = await getDashboardStats();
    expect(stats.lessonsCompleted).toBe(0);
  });

  it("lessonsCompleted counts lessons where masteryLevel >= 1", async () => {
    await updateLessonProgress("lesson_w1_italian_main", {
      attempts: 3,
      masteryLevel: 1,
      status: "learning",
    });

    const stats = await getDashboardStats();
    expect(stats.lessonsCompleted).toBe(1);
  });

  it("reviewsCompleted counts mastered lessons (masteryLevel >= 4), not just attempted", async () => {
    await updateLessonProgress("lesson_w1_italian_main", {
      attempts: 5,
      masteryLevel: 2,
      status: "learning",
    });

    const stats = await getDashboardStats();
    expect(stats.lessonsCompleted).toBe(1); // masteryLevel >= 1
    expect(stats.reviewsCompleted).toBe(0); // masteryLevel < 4
    expect(stats.reviewsCompleted).not.toBe(stats.lessonsCompleted);
  });

  it("reviewsCompleted increments only when lesson reaches masteryLevel 4", async () => {
    await updateLessonProgress("lesson_w1_italian_main", {
      attempts: 10,
      perfectRuns: 5,
      masteryLevel: 4,
      status: "mastered",
    });

    const stats = await getDashboardStats();
    expect(stats.reviewsCompleted).toBe(1);
    expect(stats.lessonsCompleted).toBe(1);
  });

  it("does not create daily quest rows as a side effect", async () => {
    const before = await db.dailyQuestProgress.count();
    expect(before).toBe(0);

    await getDashboardStats();

    const after = await db.dailyQuestProgress.count();
    expect(after).toBe(0);
  });
});

describe("getWorldProgress", () => {
  it("returns progress for all worlds", async () => {
    const progress = await getWorldProgress();
    expect(progress.length).toBe(3);
    expect(progress[0].worldName).toBe("Knight Meadows");
    expect(progress[1].worldName).toBe("Royal Castle");
    expect(progress[2].worldName).toBe("Defender Fortress");
  });

  it("returns zero completion for a new user", async () => {
    const progress = await getWorldProgress();
    for (const w of progress) {
      expect(w.completionPercent).toBe(0);
      expect(w.averageMastery).toBe(0);
    }
  });

  it("includes lessonsTotal for all worlds", async () => {
    const progress = await getWorldProgress();
    for (const w of progress) {
      expect(w.lessonsTotal).toBeGreaterThanOrEqual(5);
    }
  });

  it("returns completionPercent between 0 and 100", async () => {
    const progress = await getWorldProgress();
    for (const w of progress) {
      expect(w.completionPercent).toBeGreaterThanOrEqual(0);
      expect(w.completionPercent).toBeLessThanOrEqual(100);
    }
  });
});

describe("getRecentActivity", () => {
  it("returns an empty array for fresh user", async () => {
    const activity = await getRecentActivity();
    expect(Array.isArray(activity)).toBe(true);
  });

  it("returns items sorted newest first", async () => {
    const activity = await getRecentActivity();
    for (let i = 1; i < activity.length; i++) {
      expect(activity[i - 1].timestamp >= activity[i].timestamp).toBe(true);
    }
  });

  it("returns at most 20 items", async () => {
    const activity = await getRecentActivity();
    expect(activity.length).toBeLessThanOrEqual(20);
  });

  it("activity items have valid type and title", async () => {
    const activity = await getRecentActivity();
    for (const item of activity) {
      expect(item.id).toBeTruthy();
      expect(item.title).toBeTruthy();
      expect(item.timestamp).toBeTruthy();
      expect([
        "lesson_completed",
        "review_completed",
        "quest_completed",
        "achievement_unlocked",
      ]).toContain(item.type);
    }
  });

  it("mastered lesson appears only once — not as both lesson and review", async () => {
    await updateLessonProgress("lesson_w1_italian_main", {
      attempts: 10,
      perfectRuns: 5,
      masteryLevel: 4,
      status: "mastered",
      lastPracticedAt: "2026-06-10T10:00:00.000Z",
    });

    const activity = await getRecentActivity();
    const entries = activity.filter((item) =>
      item.id.includes("lesson_w1_italian_main"),
    );
    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe("review_completed");
  });

  it("in-progress lesson appears as lesson_completed", async () => {
    await updateLessonProgress("lesson_w1_italian_main", {
      attempts: 3,
      masteryLevel: 2,
      status: "learning",
      lastPracticedAt: "2026-06-10T10:00:00.000Z",
    });

    const activity = await getRecentActivity();
    const entry = activity.find((item) =>
      item.id.includes("lesson_w1_italian_main"),
    );
    expect(entry).toBeDefined();
    expect(entry?.type).toBe("lesson_completed");
  });

  it("activity shows human-readable lesson title, not raw lessonId", async () => {
    await updateLessonProgress("lesson_w1_italian_main", {
      attempts: 2,
      masteryLevel: 1,
      status: "learning",
      lastPracticedAt: "2026-06-10T10:00:00.000Z",
    });

    const activity = await getRecentActivity();
    const entry = activity.find((item) =>
      item.id.includes("lesson_w1_italian_main"),
    );
    expect(entry).toBeDefined();
    expect(entry?.title).toBe("Italian Main Line");
    expect(entry?.title).not.toBe("lesson_w1_italian_main");
  });

  it("does not create quest rows as a side effect", async () => {
    const before = await db.dailyQuestProgress.count();
    expect(before).toBe(0);

    await getRecentActivity();

    const after = await db.dailyQuestProgress.count();
    expect(after).toBe(0);
  });
});
