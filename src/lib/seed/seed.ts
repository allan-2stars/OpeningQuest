import { db } from "../db.ts";
import { createUserProfile } from "../repositories/userProfileRepo.ts";
import {
  DEFAULT_USER_PROFILE,
  DEFAULT_ACHIEVEMENTS,
  DEFAULT_PIECE_SKIN,
  DEFAULT_BOARD_THEME,
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

      if (!(await db.pieceSkins.get(DEFAULT_PIECE_SKIN.id))) {
        await db.pieceSkins.add(DEFAULT_PIECE_SKIN);
      }

      if (!(await db.boardThemes.get(DEFAULT_BOARD_THEME.id))) {
        await db.boardThemes.add(DEFAULT_BOARD_THEME);
      }
    },
  );
  await seedCurriculum();
}
