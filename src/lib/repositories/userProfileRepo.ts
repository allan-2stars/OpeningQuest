import { db } from "../db.ts";
import type { UserProfile } from "../../types/domain.ts";

export async function getUserProfile(
  id: string,
): Promise<UserProfile | undefined> {
  return db.userProfile.get(id);
}

export async function createUserProfile(
  profile: UserProfile,
): Promise<string> {
  await db.userProfile.put(profile);
  return profile.id;
}

export async function updateUserProfile(
  id: string,
  updates: Partial<Omit<UserProfile, "id">>,
): Promise<void> {
  const count = await db.userProfile.update(id, updates);
  if (count === 0) throw new Error(`UserProfile not found: ${id}`);
}
