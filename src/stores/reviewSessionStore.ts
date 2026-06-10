import { create } from "zustand";
import type { ReviewQueueItem } from "../features/review/reviewService.ts";

type ReviewSessionState = {
  queue: ReviewQueueItem[];
  currentIndex: number;
  totalXpEarned: number;
  isActive: boolean;
};

type ReviewSessionActions = {
  /** Start a new review session with the given queue. */
  startReview: (queue: ReviewQueueItem[]) => void;
  /** Record XP from the just-completed review lesson and advance to the next. */
  advanceReview: (xpEarned: number) => void;
  /** Reset the store after the session is finished. */
  endReview: () => void;
};

export type ReviewSessionStore = ReviewSessionState & ReviewSessionActions;

export const useReviewSessionStore = create<ReviewSessionStore>((set) => ({
  queue: [],
  currentIndex: 0,
  totalXpEarned: 0,
  isActive: false,

  startReview: (queue) =>
    set({ queue, currentIndex: 0, totalXpEarned: 0, isActive: true }),

  advanceReview: (xpEarned) =>
    set((state) => ({
      currentIndex: state.currentIndex + 1,
      totalXpEarned: state.totalXpEarned + xpEarned,
    })),

  endReview: () =>
    set({ queue: [], currentIndex: 0, totalXpEarned: 0, isActive: false }),
}));
