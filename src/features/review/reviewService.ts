import { getAllLessonProgress } from "../../lib/repositories/lessonProgressRepo.ts";
import { getLessons, getAllWorlds } from "../../lib/repositories/curriculumRepo.ts";
import { nowISO } from "../../lib/date.ts";

export type ReviewQueueItem = {
  lessonId: string;
  lessonName: string;
  worldId: string;
  masteryLevel: number;
  dueDate: string;
};

/**
 * Return all mastered lessons whose next review date is today or in the past,
 * sorted oldest-due-first.
 */
export async function getDueLessons(): Promise<ReviewQueueItem[]> {
  const now = nowISO();
  const allProgress = await getAllLessonProgress();

  const due = allProgress.filter(
    (p) => p.masteryLevel >= 4 && p.nextReviewAt !== undefined && p.nextReviewAt <= now,
  );

  if (due.length === 0) return [];

  const [lessons, worlds] = await Promise.all([
    getLessons(due.map((p) => p.lessonId)),
    getAllWorlds(),
  ]);

  const lessonById = new Map(lessons.map((l) => [l.id, l]));

  const worldIdByLesson = new Map<string, string>();
  for (const world of worlds) {
    for (const lessonId of world.lessonIds) {
      worldIdByLesson.set(lessonId, world.id);
    }
  }

  const items: ReviewQueueItem[] = due.map((p) => ({
    lessonId: p.lessonId,
    lessonName: lessonById.get(p.lessonId)?.title ?? p.lessonId,
    worldId: worldIdByLesson.get(p.lessonId) ?? "",
    masteryLevel: p.masteryLevel,
    dueDate: p.nextReviewAt!,
  }));

  return items.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

/** Alias for getDueLessons — returns the ordered review queue. */
export async function getReviewQueue(): Promise<ReviewQueueItem[]> {
  return getDueLessons();
}
