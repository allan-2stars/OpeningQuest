import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../../../lib/db.ts";
import { seedCoreData } from "../../../lib/seed/seed.ts";
import {
  ensureTodayQuests,
  recordQuestEvent,
  getTodayQuestState,
  claimQuestReward,
  claimAllQuestRewards,
} from "../dailyQuestService.ts";
import {
  getTodayQuests,
} from "../dailyQuestRepo.ts";

beforeEach(async () => {
  await db.delete();
  await db.open();
  await seedCoreData();
});

describe("ensureTodayQuests", () => {
  it("creates 3 quests for today", async () => {
    const quests = await ensureTodayQuests();
    expect(quests.length).toBe(3);
    const ids = quests.map((q) => q.questId).sort();
    expect(ids).toEqual([
      "complete_review_1",
      "earn_xp_50",
      "practice_new_lesson_1",
    ]);
  });

  it("is idempotent — does not duplicate on second call", async () => {
    await ensureTodayQuests();
    const q2 = await ensureTodayQuests();
    expect(q2.length).toBe(3);
  });

  it("sets correct progress and target for each quest", async () => {
    const quests = await ensureTodayQuests();
    for (const q of quests) {
      expect(q.progress).toBe(0);
      expect(q.target).toBeGreaterThan(0);
      expect(q.completed).toBe(false);
      expect(q.rewardClaimed).toBe(false);
    }
  });
});

describe("recordQuestEvent", () => {
  it("increments review_completed quest progress", async () => {
    await ensureTodayQuests();
    const state = await recordQuestEvent({ type: "review_completed" });
    const reviewQuest = state.quests.find((q) => q.questId === "complete_review_1");
    expect(reviewQuest?.progress).toBe(1);
    expect(reviewQuest?.completed).toBe(true);
  });

  it("increments new_lesson quest progress", async () => {
    await ensureTodayQuests();
    const state = await recordQuestEvent({ type: "new_lesson_practiced" });
    const newQuest = state.quests.find((q) => q.questId === "practice_new_lesson_1");
    expect(newQuest?.progress).toBe(1);
    expect(newQuest?.completed).toBe(true);
  });

  it("increments earn_xp quest progress", async () => {
    await ensureTodayQuests();
    const state = await recordQuestEvent({ type: "xp_earned", amount: 30 });
    const xpQuest = state.quests.find((q) => q.questId === "earn_xp_50");
    expect(xpQuest?.progress).toBe(30);
  });

  it("caps progress at target", async () => {
    await ensureTodayQuests();
    // Fire an event larger than target
    const state = await recordQuestEvent({ type: "xp_earned", amount: 100 });
    const xpQuest = state.quests.find((q) => q.questId === "earn_xp_50");
    expect(xpQuest?.progress).toBe(50);
    expect(xpQuest?.completed).toBe(true);
  });

  it("does not count quest_reward XP toward earn_xp_50", async () => {
    await ensureTodayQuests();
    const state = await recordQuestEvent({
      type: "xp_earned",
      amount: 100,
      source: "quest_reward",
    });
    const xpQuest = state.quests.find((q) => q.questId === "earn_xp_50");
    expect(xpQuest?.progress).toBe(0);
  });

  it("does not over-complete already completed quests", async () => {
    await ensureTodayQuests();
    // Complete review quest
    await recordQuestEvent({ type: "review_completed" });
    // Fire again — should stay at 1
    const state = await recordQuestEvent({ type: "review_completed" });
    const reviewQuest = state.quests.find((q) => q.questId === "complete_review_1");
    expect(reviewQuest?.progress).toBe(1);
  });
});

describe("claimQuestReward", () => {
  it("returns 0 for incomplete quest", async () => {
    await ensureTodayQuests();
    const xp = await claimQuestReward("complete_review_1");
    expect(xp).toBe(0);
  });

  it("returns reward XP for completed quest", async () => {
    await ensureTodayQuests();
    await recordQuestEvent({ type: "review_completed" });
    const xp = await claimQuestReward("complete_review_1");
    expect(xp).toBe(25);
  });

  it("returns 0 for already claimed quest", async () => {
    await ensureTodayQuests();
    await recordQuestEvent({ type: "review_completed" });
    await claimQuestReward("complete_review_1");
    const xp = await claimQuestReward("complete_review_1");
    expect(xp).toBe(0);
  });

  it("marks quest as claimed after claiming", async () => {
    await ensureTodayQuests();
    await recordQuestEvent({ type: "review_completed" });
    await claimQuestReward("complete_review_1");
    const quests = await getTodayQuests();
    const q = quests.find((q) => q.questId === "complete_review_1");
    expect(q?.rewardClaimed).toBe(true);
    expect(q?.rewardClaimedAt).toBeTruthy();
  });
});

describe("claimAllQuestRewards", () => {
  it("claims all completed quests and returns total XP", async () => {
    await ensureTodayQuests();
    await recordQuestEvent({ type: "review_completed" });
    await recordQuestEvent({ type: "new_lesson_practiced" });
    await recordQuestEvent({ type: "xp_earned", amount: 50 });

    const result = await claimAllQuestRewards();
    expect(result.totalXp).toBe(75);
    expect(result.bonusKey).toBe(true);
  });

  it("grants bonus key only once", async () => {
    await ensureTodayQuests();
    await recordQuestEvent({ type: "review_completed" });
    await recordQuestEvent({ type: "new_lesson_practiced" });
    await recordQuestEvent({ type: "xp_earned", amount: 50 });

    const first = await claimAllQuestRewards();
    expect(first.bonusKey).toBe(true);

    const second = await claimAllQuestRewards();
    expect(second.bonusKey).toBe(false);
    expect(second.totalXp).toBe(0);
  });

  it("does not grant bonus key when not all quests complete", async () => {
    await ensureTodayQuests();
    await recordQuestEvent({ type: "review_completed" });

    const result = await claimAllQuestRewards();
    expect(result.bonusKey).toBe(false);
  });
});

describe("daily quest persistence", () => {
  it("quests persist across calls to getTodayQuestState", async () => {
    await ensureTodayQuests();
    await recordQuestEvent({ type: "review_completed" });

    const state = await getTodayQuestState();
    const reviewQuest = state.quests.find((q) => q.questId === "complete_review_1");
    expect(reviewQuest?.completed).toBe(true);
  });
});
