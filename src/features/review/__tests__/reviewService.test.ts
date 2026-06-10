import { describe, it, expect, beforeEach } from "vitest";
import { getDueLessons, getReviewQueue } from "../reviewService.ts";
import { db } from "../../../lib/db.ts";
import { seedCoreData } from "../../../lib/seed/seed.ts";
import { upsertLessonProgress } from "../../../lib/repositories/lessonProgressRepo.ts";
import "fake-indexeddb/auto";

beforeEach(async () => {
  await db.delete();
  await db.open();
  await seedCoreData();
});

describe("getDueLessons", () => {
  it("returns empty array when no lessons have review dates", async () => {
    const items = await getDueLessons();
    expect(items).toHaveLength(0);
  });

  it("returns a lesson that is overdue", async () => {
    await upsertLessonProgress({
      lessonId: "lesson_w1_italian_main",
      masteryLevel: 4,
      perfectRuns: 10,
      attempts: 10,
      mistakes: 0,
      status: "mastered",
      failedReviewCount: 0,
      lastPracticedAt: "2026-01-01T00:00:00.000Z",
      nextReviewAt: "2026-01-02T00:00:00.000Z", // in the past
    });

    const items = await getDueLessons();
    expect(items).toHaveLength(1);
    expect(items[0].lessonId).toBe("lesson_w1_italian_main");
    expect(items[0].masteryLevel).toBe(4);
    expect(items[0].lessonName).toBeDefined();
    expect(items[0].lessonName.length).toBeGreaterThan(0);
  });

  it("excludes a lesson not yet due", async () => {
    const farFuture = new Date();
    farFuture.setFullYear(farFuture.getFullYear() + 10);

    await upsertLessonProgress({
      lessonId: "lesson_w1_italian_main",
      masteryLevel: 4,
      perfectRuns: 10,
      attempts: 10,
      mistakes: 0,
      status: "mastered",
      failedReviewCount: 0,
      nextReviewAt: farFuture.toISOString(),
    });

    const items = await getDueLessons();
    expect(items).toHaveLength(0);
  });

  it("excludes lessons with masteryLevel < 4", async () => {
    await upsertLessonProgress({
      lessonId: "lesson_w1_italian_main",
      masteryLevel: 3,
      perfectRuns: 7,
      attempts: 7,
      mistakes: 0,
      status: "learning",
      failedReviewCount: 0,
      nextReviewAt: "2026-01-01T00:00:00.000Z", // past date but not mastered
    });

    const items = await getDueLessons();
    expect(items).toHaveLength(0);
  });

  it("sorts multiple due lessons oldest-first", async () => {
    await upsertLessonProgress({
      lessonId: "lesson_w1_italian_main",
      masteryLevel: 4,
      perfectRuns: 10,
      attempts: 10,
      mistakes: 0,
      status: "mastered",
      failedReviewCount: 0,
      nextReviewAt: "2026-01-03T00:00:00.000Z",
    });

    await upsertLessonProgress({
      lessonId: "lesson_w1_london_main",
      masteryLevel: 4,
      perfectRuns: 10,
      attempts: 10,
      mistakes: 0,
      status: "mastered",
      failedReviewCount: 0,
      nextReviewAt: "2026-01-01T00:00:00.000Z", // older — should be first
    });

    const items = await getDueLessons();
    expect(items).toHaveLength(2);
    expect(items[0].lessonId).toBe("lesson_w1_london_main");
    expect(items[1].lessonId).toBe("lesson_w1_italian_main");
  });
});

describe("getReviewQueue", () => {
  it("is an alias for getDueLessons — same result", async () => {
    await upsertLessonProgress({
      lessonId: "lesson_w1_italian_main",
      masteryLevel: 4,
      perfectRuns: 10,
      attempts: 10,
      mistakes: 0,
      status: "mastered",
      failedReviewCount: 0,
      nextReviewAt: "2026-01-01T00:00:00.000Z",
    });

    const due = await getDueLessons();
    const queue = await getReviewQueue();
    expect(queue).toEqual(due);
  });
});
