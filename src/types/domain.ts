// Side — which colour the player is training
export type Side = "white" | "black";

// Difficulty tiers for worlds, lessons, and openings
export type Difficulty = "beginner" | "intermediate" | "advanced";

// Mastery level: 0 = untouched, 4 = permanent
export type MasteryLevel = 0 | 1 | 2 | 3 | 4;

// Lesson status drives UI availability and review scheduling
export type LessonStatus =
  | "locked"
  | "available"
  | "learning"
  | "mastered"
  | "review_due";

// Practice mode selected during a training session
export type PracticeMode = "guided" | "instinct";

// Source of an opening line
export type LineSource = "builtin" | "user" | "imported";

// --- Core domain entities ---

export type World = {
  id: string;
  order: number;
  name: string;
  description: string;
  theme: string;
  difficulty: Difficulty;
  rewardSetId?: string;
  lessonIds: string[];
  bossBattleId?: string;
};

export type OpeningFamily = {
  id: string;
  name: string;
  side: Side;
  ecoCodes?: string[];
  description?: string;
  variationIds: string[];
};

export type Variation = {
  id: string;
  openingFamilyId: string;
  name: string;
  description?: string;
  lessonIds: string[];
  prerequisiteVariationIds?: string[];
};

export type Lesson = {
  id: string;
  variationId: string;
  title: string;
  side: Side;
  difficulty: Difficulty;
  depth: number;
  lineId: string;
  unlockKeyCost?: number;
  requiredLessonIds?: string[];
};

export type OpeningLine = {
  id: string;
  pgn: string;
  sanMoves: string[];
  fenPositions: string[];
  source: LineSource;
  createdAt: string;
  updatedAt: string;
};

// --- User & progress ---

export type UserProfile = {
  id: string;
  displayName: string;
  level: number;
  totalXp: number;
  keys: number;
  currentStreak: number;
  longestStreak: number;
  createdAt: string;
};

export type LessonProgress = {
  lessonId: string;
  masteryLevel: MasteryLevel;
  perfectRuns: number;
  attempts: number;
  mistakes: number;
  status: LessonStatus;
  lastPracticedAt?: string;
  nextReviewAt?: string;
  failedReviewCount: number;
};

export type TrainingSession = {
  id: string;
  lessonId: string;
  mode: PracticeMode;
  correctMoves: number;
  totalMoves: number;
  perfect: boolean;
  startedAt: string;
  completedAt?: string;
};

// --- Rewards & collection ---

export type Achievement = {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  unlockedAt?: string;
};

export type PieceSkin = {
  id: string;
  name: string;
  description: string;
  pieceType: string;
  unlocked: boolean;
  previewUrl: string;
};

export type BoardTheme = {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  previewUrl: string;
  lightSquareColor: string;
  darkSquareColor: string;
};

// --- Daily quests ---

export type DailyQuest = {
  id: string;
  date: string;
  description: string;
  questType: "complete_lesson" | "perfect_run" | "review" | "streak";
  target: number;
  progress: number;
  completed: boolean;
  xpReward: number;
};
