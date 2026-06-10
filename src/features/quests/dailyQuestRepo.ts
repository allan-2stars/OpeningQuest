import { todayDateString } from "../../lib/date.ts";
import { db } from "../../lib/db.ts";
import type { DailyQuestProgress, DailyQuestBonus } from "../../types/domain.ts";

export async function getTodayQuests(): Promise<DailyQuestProgress[]> {
  const today = todayDateString();
  return db.dailyQuestProgress.where("date").equals(today).toArray();
}

export async function getTodayBonus(): Promise<DailyQuestBonus | undefined> {
  const today = todayDateString();
  return db.dailyQuestBonus.get(today);
}

export async function upsertQuestProgress(quest: DailyQuestProgress): Promise<void> {
  await db.dailyQuestProgress.put(quest);
}

export async function upsertBonus(bonus: DailyQuestBonus): Promise<void> {
  await db.dailyQuestBonus.put(bonus);
}
