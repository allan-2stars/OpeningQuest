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
