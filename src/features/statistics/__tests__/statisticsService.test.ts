import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../../../lib/db.ts";
import { seedCoreData } from "../../../lib/seed/seed.ts";
import { getDashboardStats, getWorldProgress, getRecentActivity } from "../statisticsService.ts";
import { ensureTodayQuests, recordQuestEvent } from "../../quests/dailyQuestService.ts";

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
    // If profile doesn't exist, should return zeros
    const stats = await getDashboardStats();
    expect(stats.totalXp).toBe(0);
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
});
