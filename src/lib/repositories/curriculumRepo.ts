import { db } from "../db.ts";
import type {
  World,
  OpeningFamily,
  Variation,
  Lesson,
  OpeningLine,
} from "../../types/domain.ts";

export async function getAllWorlds(): Promise<World[]> {
  const worlds = await db.worlds.toArray();
  return worlds.sort((a, b) => a.order - b.order);
}

export async function getWorld(id: string): Promise<World | undefined> {
  return db.worlds.get(id);
}

export async function getLessonsByWorld(
  worldId: string,
): Promise<Lesson[]> {
  const world = await db.worlds.get(worldId);
  if (!world) return [];
  return db.lessons.bulkGet(world.lessonIds).then((lessons) =>
    lessons.filter((l): l is Lesson => l !== undefined),
  );
}

export async function getVariation(
  id: string,
): Promise<Variation | undefined> {
  return db.variations.get(id);
}

export async function getVariationsByFamily(
  familyId: string,
): Promise<Variation[]> {
  return db.variations.where("openingFamilyId").equals(familyId).toArray();
}

export async function getOpeningFamily(
  id: string,
): Promise<OpeningFamily | undefined> {
  return db.openingFamilies.get(id);
}

export async function getLesson(
  id: string,
): Promise<Lesson | undefined> {
  return db.lessons.get(id);
}

export async function getLessons(
  ids: string[],
): Promise<Lesson[]> {
  const lessons = await db.lessons.bulkGet(ids);
  return lessons.filter((l): l is Lesson => l !== undefined);
}

export async function getOpeningLine(
  id: string,
): Promise<OpeningLine | undefined> {
  return db.openingLines.get(id);
}
