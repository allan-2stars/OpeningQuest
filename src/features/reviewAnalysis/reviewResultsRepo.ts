import { db } from "../../lib/db.ts";
import type { LessonReviewResult } from "./reviewBuilderService.ts";

export async function saveReviewResult(result: LessonReviewResult): Promise<void> {
  await db.openingSessionResults.put({
    id: `review_${result.lessonId}`,
    lessonId: result.lessonId,
    completed: result.completed,
    openingExitDetected: result.summary.watchOuts > 0 || result.summary.oopses > 0,
    playedAt: result.completedAt,
  });

  // Store the full review as a JSON blob in localStorage for now
  // (openingSessionResults table doesn't have a moves column)
  try {
    localStorage.setItem(
      `review_data_${result.lessonId}`,
      JSON.stringify(result),
    );
  } catch {
    // localStorage may be full or unavailable — non-fatal
  }
}

export async function getReviewResult(lessonId: string): Promise<LessonReviewResult | null> {
  // First check if a session row exists in DB
  const session = await db.openingSessionResults.get(`review_${lessonId}`);
  if (!session) return null;

  // Then load full review data from localStorage
  try {
    const raw = localStorage.getItem(`review_data_${lessonId}`);
    if (raw) return JSON.parse(raw) as LessonReviewResult;
  } catch {
    // Corrupt storage — non-fatal
  }
  return null;
}

export async function getLatestReviewResults(limit = 10): Promise<LessonReviewResult[]> {
  const sessions = await db.openingSessionResults
    .orderBy("playedAt")
    .reverse()
    .limit(limit * 2)
    .toArray();

  const results: LessonReviewResult[] = [];
  const seen = new Set<string>();

  for (const session of sessions) {
    if (seen.has(session.lessonId)) continue;
    seen.add(session.lessonId);

    const review = await getReviewResult(session.lessonId);
    if (review) {
      results.push(review);
      if (results.length >= limit) break;
    }
  }

  return results;
}
