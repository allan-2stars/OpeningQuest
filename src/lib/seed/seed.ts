import { db } from "../db.ts";
import { createUserProfile } from "../repositories/userProfileRepo.ts";
import {
  DEFAULT_USER_PROFILE,
  DEFAULT_ACHIEVEMENTS,
  DEFAULT_PIECE_SKINS,
  DEFAULT_BOARD_THEMES,
} from "./defaults.ts";
import { seedCurriculum } from "./seedCurriculum.ts";

export async function seedCoreData(): Promise<void> {
  await db.transaction(
    "rw",
    [db.userProfile, db.achievements, db.pieceSkins, db.boardThemes],
    async () => {
      if (!(await db.userProfile.get(DEFAULT_USER_PROFILE.id))) {
        await createUserProfile(DEFAULT_USER_PROFILE);
      }

      const existingAchievementIds = new Set(
        (await db.achievements.toArray()).map((a) => a.id),
      );
      const newAchievements = DEFAULT_ACHIEVEMENTS.filter(
        (a) => !existingAchievementIds.has(a.id),
      );
      if (newAchievements.length > 0) {
        await db.achievements.bulkAdd(newAchievements);
      }

      const existingPieceSkinIds = new Set(
        (await db.pieceSkins.toArray()).map((s) => s.id),
      );
      const newSkins = DEFAULT_PIECE_SKINS.filter(
        (s) => !existingPieceSkinIds.has(s.id),
      );
      if (newSkins.length > 0) {
        await db.pieceSkins.bulkAdd(newSkins);
      }

      const existingBoardThemeIds = new Set(
        (await db.boardThemes.toArray()).map((t) => t.id),
      );
      const newThemes = DEFAULT_BOARD_THEMES.filter(
        (t) => !existingBoardThemeIds.has(t.id),
      );
      if (newThemes.length > 0) {
        await db.boardThemes.bulkAdd(newThemes);
      }
    },
  );
  await seedCurriculum();
}
