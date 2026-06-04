import { db } from "../db.ts";
import { createUserProfile } from "../repositories/userProfileRepo.ts";
import {
  DEFAULT_USER_PROFILE,
  DEFAULT_ACHIEVEMENTS,
  DEFAULT_PIECE_SKIN,
  DEFAULT_BOARD_THEME,
} from "./defaults.ts";

export async function seedCoreData(): Promise<void> {
  const existingProfile = await db.userProfile.get(DEFAULT_USER_PROFILE.id);
  if (!existingProfile) {
    await createUserProfile(DEFAULT_USER_PROFILE);
  }

  await db.achievements.bulkPut(DEFAULT_ACHIEVEMENTS);
  await db.pieceSkins.put(DEFAULT_PIECE_SKIN);
  await db.boardThemes.put(DEFAULT_BOARD_THEME);
}
