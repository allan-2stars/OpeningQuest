/** Days until next review, indexed by mastery level. Lv4+ uses the last entry. */
const REVIEW_DAYS_BY_LEVEL: readonly number[] = [1, 3, 7, 14, 30];

/**
 * Calculate the date of the next scheduled review given the player's mastery
 * level and when they completed the session.
 */
export function calculateNextReviewDate(masteryLevel: number, completedAt: Date): Date {
  const idx = Math.max(0, Math.min(masteryLevel, REVIEW_DAYS_BY_LEVEL.length - 1));
  const days = REVIEW_DAYS_BY_LEVEL[idx];
  const result = new Date(completedAt);
  result.setDate(result.getDate() + days);
  return result;
}
