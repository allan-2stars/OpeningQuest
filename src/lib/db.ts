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
} from "../types/domain.ts";

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
  }
}

export const db = new OpeningQuestDB();
