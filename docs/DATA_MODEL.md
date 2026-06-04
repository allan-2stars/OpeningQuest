# DATA_MODEL.md

# Opening Quest - Data Model

## Principles

The data model must support:
- Offline-first operation
- Adventure Mode
- Classic Mode
- PGN import/export
- Custom openings
- Future cloud sync
- Future Stockfish analysis

## Entity Hierarchy

World
OpeningFamily
Variation
Lesson
OpeningLine
UserProgress

## TypeScript Models

```ts
export type Side = "white" | "black";
export type Difficulty = "beginner" | "intermediate" | "advanced";

export type World = {
  id: string;
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
  source: "builtin" | "user" | "imported";
  createdAt: string;
  updatedAt: string;
};

export type LessonProgress = {
  lessonId: string;
  masteryLevel: 0 | 1 | 2 | 3 | 4;
  perfectRuns: number;
  attempts: number;
  mistakes: number;
  status: "locked" | "available" | "learning" | "mastered" | "review_due";
  lastPracticedAt?: string;
  nextReviewAt?: string;
  failedReviewCount: number;
};

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
```

## Golden Rule

Progress is tracked at lesson level.

Mastery is tracked at lesson level.

Rewards are granted primarily from lesson and world events.
