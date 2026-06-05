import { db } from "../db.ts";
import {
  CURRICULUM_WORLDS,
  CURRICULUM_FAMILIES,
  CURRICULUM_VARIATIONS,
  CURRICULUM_LESSONS,
  CURRICULUM_LINES,
  makeDefaultLessonProgress,
} from "./curriculum.ts";

export async function seedCurriculum(): Promise<void> {
  await db.transaction(
    "rw",
    [db.worlds, db.openingFamilies, db.variations, db.lessons, db.openingLines, db.lessonProgress],
    async () => {
      if ((await db.worlds.count()) === 0) {
        await db.worlds.bulkAdd(CURRICULUM_WORLDS);
      }
      if ((await db.openingFamilies.count()) === 0) {
        await db.openingFamilies.bulkAdd(CURRICULUM_FAMILIES);
      }
      if ((await db.variations.count()) === 0) {
        await db.variations.bulkAdd(CURRICULUM_VARIATIONS);
      }
      if ((await db.lessons.count()) === 0) {
        await db.lessons.bulkAdd(CURRICULUM_LESSONS);
      }
      if ((await db.openingLines.count()) === 0) {
        await db.openingLines.bulkAdd(CURRICULUM_LINES);
      }
      if ((await db.lessonProgress.count()) === 0) {
        await db.lessonProgress.bulkAdd(makeDefaultLessonProgress());
      }
    },
  );
}
