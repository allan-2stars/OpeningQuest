import Dexie, { type Table } from "dexie";
import type {
  World,
  OpeningFamily,
  Variation,
  Lesson,
  OpeningLine,
  UserProfile,
  LessonProgress,
  TrainingSession,
  Achievement,
  PieceSkin,
  BoardTheme,
  DailyQuest,
  DailyQuestProgress,
  DailyQuestBonus,
} from "../types/domain.ts";
import type { OpeningSessionResult } from "../features/openings/types.ts";

export class OpeningQuestDB extends Dexie {
  worlds!: Table<World, string>;
  openingFamilies!: Table<OpeningFamily, string>;
  variations!: Table<Variation, string>;
  lessons!: Table<Lesson, string>;
  openingLines!: Table<OpeningLine, string>;
  userProfile!: Table<UserProfile, string>;
  lessonProgress!: Table<LessonProgress, string>;
  trainingSessions!: Table<TrainingSession, string>;
  achievements!: Table<Achievement, string>;
  pieceSkins!: Table<PieceSkin, string>;
  boardThemes!: Table<BoardTheme, string>;
  dailyQuests!: Table<DailyQuest, string>;
  dailyQuestProgress!: Table<DailyQuestProgress, string>;
  dailyQuestBonus!: Table<DailyQuestBonus, string>;
  openingSessionResults!: Table<OpeningSessionResult, string>;

  constructor() {
    super("OpeningQuestDB");
    this.version(1).stores({
      worlds: "id",
      openingFamilies: "id",
      variations: "id, openingFamilyId",
      lessons: "id, variationId",
      openingLines: "id",
      userProfile: "id",
      lessonProgress: "lessonId",
      trainingSessions: "id, lessonId, startedAt",
      achievements: "id",
      pieceSkins: "id",
      boardThemes: "id",
      dailyQuests: "id, date",
    });
    this.version(2).stores({
      worlds: "id",
      openingFamilies: "id",
      variations: "id, openingFamilyId",
      lessons: "id, variationId",
      openingLines: "id",
      userProfile: "id",
      lessonProgress: "lessonId",
      trainingSessions: "id, lessonId, startedAt",
      achievements: "id",
      pieceSkins: "id",
      boardThemes: "id",
      dailyQuests: "id, date",
      dailyQuestProgress: "id, date, questId",
      dailyQuestBonus: "id, date",
    });
    this.version(3).stores({
      worlds: "id",
      openingFamilies: "id",
      variations: "id, openingFamilyId",
      lessons: "id, variationId",
      openingLines: "id",
      userProfile: "id",
      lessonProgress: "lessonId",
      trainingSessions: "id, lessonId, startedAt",
      achievements: "id",
      pieceSkins: "id",
      boardThemes: "id",
      dailyQuests: "id, date",
      dailyQuestProgress: "id, date, questId",
      dailyQuestBonus: "id, date",
      openingSessionResults: "id, lessonId, playedAt",
    });
  }
}

export const db = new OpeningQuestDB();
