import { db } from "../db.ts";
import type { OpeningLine, Lesson, Variation, OpeningFamily, Side } from "../../types/domain.ts";

/**
 * Insert or replace an opening line. For imported lines this always replaces.
 */
export async function putOpeningLine(line: OpeningLine): Promise<void> {
  await db.openingLines.put(line);
}

/**
 * Insert or replace a lesson. Does not affect existing progress records.
 */
export async function putLesson(lesson: Lesson): Promise<void> {
  await db.lessons.put(lesson);
}

/**
 * Insert or replace a variation.
 */
export async function putVariation(variation: Variation): Promise<void> {
  await db.variations.put(variation);
}

/**
 * Insert or replace an opening family.
 */
export async function putOpeningFamily(family: OpeningFamily): Promise<void> {
  await db.openingFamilies.put(family);
}

/**
 * Store a fully imported opening as a custom addition.
 * Creates the line, lesson, variation, and family records
 * so the imported opening is playable via /practice/:lessonId.
 *
 * Returns the lesson ID for navigation.
 */
export async function addImportedOpening(
  line: OpeningLine,
  name: string,
  side: Side,
): Promise<string> {
  const safeName = name.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 40);
  const baseId = `custom_${safeName}_${Date.now()}`;
  const familyId = `family_${baseId}`;
  const variationId = `var_${baseId}`;
  const lessonId = `lesson_${baseId}`;

  const family: OpeningFamily = {
    id: familyId,
    name,
    side,
    description: "Imported custom opening.",
    variationIds: [variationId],
  };

  const variation: Variation = {
    id: variationId,
    openingFamilyId: familyId,
    name,
    lessonIds: [lessonId],
  };

  const lesson: Lesson = {
    id: lessonId,
    variationId,
    title: name,
    side,
    difficulty: "beginner",
    depth: side === "white"
      ? Math.ceil(line.sanMoves.length / 2)
      : Math.floor(line.sanMoves.length / 2),
    lineId: line.id,
  };

  await db.transaction("rw", [db.openingLines, db.openingFamilies, db.variations, db.lessons], async () => {
    await putOpeningLine(line);
    await putOpeningFamily(family);
    await putVariation(variation);
    await putLesson(lesson);
  });

  return lessonId;
}

/**
 * Get all imported/custom opening lines.
 */
export async function getImportedLines(): Promise<OpeningLine[]> {
  return db.openingLines
    .filter((l) => l.source !== "builtin")
    .toArray();
}
