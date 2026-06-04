import { db } from "../db.ts";
import type { LessonProgress } from "../../types/domain.ts";

export async function getLessonProgress(
  lessonId: string,
): Promise<LessonProgress | undefined> {
  return db.lessonProgress.get(lessonId);
}

export async function getAllLessonProgress(): Promise<LessonProgress[]> {
  return db.lessonProgress.toArray();
}

export async function upsertLessonProgress(
  progress: LessonProgress,
): Promise<string> {
  await db.lessonProgress.put(progress);
  return progress.lessonId;
}

export async function updateLessonProgress(
  lessonId: string,
  updates: Partial<Omit<LessonProgress, "lessonId">>,
): Promise<void> {
  await db.lessonProgress.update(lessonId, updates);
}
