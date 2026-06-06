import { db } from "../db.ts";
import type {
  Achievement,
  PieceSkin,
  BoardTheme,
} from "../../types/domain.ts";

export async function getAllAchievements(): Promise<Achievement[]> {
  return db.achievements.toArray();
}

export async function getUnlockedAchievements(): Promise<Achievement[]> {
  return db.achievements.filter((a) => a.unlockedAt !== undefined).toArray();
}

export async function getAchievement(
  id: string,
): Promise<Achievement | undefined> {
  return db.achievements.get(id);
}

export async function getAllPieceSkins(): Promise<PieceSkin[]> {
  return db.pieceSkins.toArray();
}

export async function getUnlockedPieceSkins(): Promise<PieceSkin[]> {
  return db.pieceSkins.filter((s) => s.unlocked).toArray();
}

export async function getAllBoardThemes(): Promise<BoardTheme[]> {
  return db.boardThemes.toArray();
}

export async function getUnlockedBoardThemes(): Promise<BoardTheme[]> {
  return db.boardThemes.filter((t) => t.unlocked).toArray();
}

export async function updateAchievement(
  id: string,
  updates: Partial<Omit<Achievement, "id">>,
): Promise<void> {
  await db.achievements.update(id, updates);
}

export async function updatePieceSkin(
  id: string,
  updates: Partial<Omit<PieceSkin, "id">>,
): Promise<void> {
  await db.pieceSkins.update(id, updates);
}

export async function updateBoardTheme(
  id: string,
  updates: Partial<Omit<BoardTheme, "id">>,
): Promise<void> {
  await db.boardThemes.update(id, updates);
}
