export type QuestDefinition = {
  questId: string;
  title: string;
  description: string;
  target: number;
  rewardXp: number;
};

export const DAILY_QUEST_DEFINITIONS: QuestDefinition[] = [
  {
    questId: "complete_review_1",
    title: "Review Review!",
    description: "Complete 1 review lesson.",
    target: 1,
    rewardXp: 25,
  },
  {
    questId: "practice_new_lesson_1",
    title: "Fresh Moves",
    description: "Practice 1 new lesson.",
    target: 1,
    rewardXp: 25,
  },
  {
    questId: "earn_xp_50",
    title: "XP Hunter",
    description: "Earn 50 XP.",
    target: 50,
    rewardXp: 25,
  },
];

export const DAILY_BONUS_KEY = 1;
