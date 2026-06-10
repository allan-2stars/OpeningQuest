import { todayDateString, nowISO } from "../../lib/date.ts";
import {
  getTodayQuests,
  getTodayBonus,
  upsertQuestProgress,
  upsertBonus,
} from "./dailyQuestRepo.ts";
import {
  DAILY_QUEST_DEFINITIONS,
  DAILY_BONUS_KEY,
} from "./dailyQuestDefinitions.ts";
import { getUserProfile, updateUserProfile } from "../../lib/repositories/userProfileRepo.ts";
import type { DailyQuestProgress, DailyQuestBonus } from "../../types/domain.ts";

const DEFAULT_USER_ID = "user_default";

export type QuestEvent =
  | { type: "review_completed" }
  | { type: "new_lesson_practiced" }
  | { type: "xp_earned"; amount: number; source?: string };

export type QuestWithState = DailyQuestProgress & {
  rewardXp: number;
};

export type DailyQuestState = {
  quests: QuestWithState[];
  bonus: DailyQuestBonus | null;
};

function makeQuestId(questId: string): string {
  return `${todayDateString()}_${questId}`;
}

function makeBonusId(): string {
  return todayDateString();
}

function isToday(id: string): boolean {
  return id.startsWith(todayDateString());
}

/** Create today's quest rows if they don't exist yet. */
export async function ensureTodayQuests(): Promise<DailyQuestProgress[]> {
  const today = todayDateString();
  const existing = await getTodayQuests();

  if (existing.length > 0 && isToday(existing[0].id)) {
    return existing;
  }

  // Create fresh quests for today
  const quests: DailyQuestProgress[] = DAILY_QUEST_DEFINITIONS.map((def) => ({
    id: makeQuestId(def.questId),
    date: today,
    questId: def.questId,
    title: def.title,
    progress: 0,
    target: def.target,
    completed: false,
    rewardClaimed: false,
  }));

  for (const q of quests) {
    await upsertQuestProgress(q);
  }

  return quests;
}

/** Record a gameplay event and update daily quest progress. */
export async function recordQuestEvent(event: QuestEvent): Promise<DailyQuestState> {
  // Quest reward XP should not trigger xp_earned quest progress
  if (event.type === "xp_earned" && event.source === "quest_reward") {
    const quests = await ensureTodayQuests();
    const bonus = await getTodayBonus();
    return buildState(quests, bonus);
  }

  const quests = await ensureTodayQuests();

  for (let i = 0; i < quests.length; i++) {
    const q = quests[i];
    if (q.completed) continue;

    let progressDelta = 0;

    switch (q.questId) {
      case "complete_review_1":
        if (event.type === "review_completed") {
          progressDelta = 1;
        }
        break;

      case "practice_new_lesson_1":
        if (event.type === "new_lesson_practiced") {
          progressDelta = 1;
        }
        break;

      case "earn_xp_50":
        if (event.type === "xp_earned") {
          progressDelta = event.amount;
        }
        break;
    }

    if (progressDelta > 0) {
      const newProgress = Math.min(q.target, q.progress + progressDelta);
      quests[i] = {
        ...q,
        progress: newProgress,
        completed: newProgress >= q.target,
        completedAt: newProgress >= q.target ? nowISO() : q.completedAt,
      };
      await upsertQuestProgress(quests[i]);
    }
  }

  const bonus = await getTodayBonus();
  return buildState(quests, bonus);
}

/** Get today's quest state with reward XP from definitions. */
export async function getTodayQuestState(): Promise<DailyQuestState> {
  const quests = await ensureTodayQuests();
  const bonus = await getTodayBonus();
  return buildState(quests, bonus);
}

/**
 * Read today's quest state without creating rows.
 * Safe to call from read-only contexts (e.g. statistics service).
 * Returns null if quests have not been initialized yet.
 */
export async function getTodayQuestStateReadOnly(): Promise<DailyQuestState | null> {
  const quests = await getTodayQuests();
  if (quests.length === 0) return null;
  const bonus = await getTodayBonus();
  return buildState(quests, bonus);
}

/** Claim reward for a single completed quest. Returns XP awarded. */
export async function claimQuestReward(questId: string): Promise<number> {
  const quests = await ensureTodayQuests();
  const q = quests.find((q) => q.questId === questId);
  if (!q || !q.completed || q.rewardClaimed) return 0;

  const def = DAILY_QUEST_DEFINITIONS.find((d) => d.questId === questId);
  if (!def) return 0;

  const updated: DailyQuestProgress = {
    ...q,
    rewardClaimed: true,
    rewardClaimedAt: nowISO(),
  };
  await upsertQuestProgress(updated);

  // Award XP
  await addXpToProfile(def.rewardXp);

  return def.rewardXp;
}

/** Claim all completed quest rewards + all-complete bonus key if applicable. */
export async function claimAllQuestRewards(): Promise<{
  totalXp: number;
  bonusKey: boolean;
}> {
  const quests = await ensureTodayQuests();
  const bonus = await getTodayBonus();

  let totalXp = 0;

  // Claim each completed quest
  for (const q of quests) {
    if (q.completed && !q.rewardClaimed) {
      const xp = await claimQuestReward(q.questId);
      totalXp += xp;
    }
  }

  // Check all-complete bonus
  const refreshedQuests = await getTodayQuests();
  const allComplete = refreshedQuests.length === DAILY_QUEST_DEFINITIONS.length && refreshedQuests.every((q) => q.completed);
  const allClaimed = refreshedQuests.every((q) => q.rewardClaimed);
  let bonusKey = false;

  if (allComplete && allClaimed && (!bonus || !bonus.claimed)) {
    const newBonus: DailyQuestBonus = {
      id: makeBonusId(),
      date: todayDateString(),
      claimed: true,
      claimedAt: nowISO(),
    };
    await upsertBonus(newBonus);

    // Grant bonus key
    const profile = await getUserProfile(DEFAULT_USER_ID);
    if (profile) {
      await updateUserProfile(DEFAULT_USER_ID, {
        keys: profile.keys + DAILY_BONUS_KEY,
      });
    }
    bonusKey = true;
  }

  return { totalXp, bonusKey };
}

async function addXpToProfile(xp: number): Promise<void> {
  const profile = await getUserProfile(DEFAULT_USER_ID);
  if (!profile) return;
  await updateUserProfile(DEFAULT_USER_ID, {
    totalXp: profile.totalXp + xp,
  });
  // Also record the XP event so earn_xp_50 can track it
  // But quest_reward source is excluded (handled by the guard in recordQuestEvent)
  // We deliberately do NOT call recordQuestEvent here to avoid recursion.
  // Instead, XP is added directly and earn_xp_50 is updated separately via recordQuestEvent
  // with the "quest_reward" source guard.
}

function buildState(
  quests: DailyQuestProgress[],
  bonus: DailyQuestBonus | undefined,
): DailyQuestState {
  return {
    quests: quests.map((q) => {
      const def = DAILY_QUEST_DEFINITIONS.find((d) => d.questId === q.questId);
      return { ...q, rewardXp: def?.rewardXp ?? 0 };
    }),
    bonus: bonus ?? null,
  };
}
