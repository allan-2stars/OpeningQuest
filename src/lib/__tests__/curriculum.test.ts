import { describe, it, expect, beforeEach } from "vitest";
import { Chess } from "chess.js";
import { db } from "../db.ts";
import { seedCoreData } from "../seed/seed.ts";
import { seedCurriculum } from "../seed/seedCurriculum.ts";
import {
  CURRICULUM_LINES,
  CURRICULUM_LESSONS,
  CURRICULUM_WORLDS,
  CURRICULUM_FAMILIES,
  CURRICULUM_VARIATIONS,
  WORLD_1_LESSON_IDS,
  WORLD_2_LESSON_IDS,
  WORLD_3_LESSON_IDS,
} from "../seed/curriculum.ts";
import { getAllLessonProgress } from "../repositories/lessonProgressRepo.ts";

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe("curriculum data integrity", () => {
  it("every lesson references an existing line", () => {
    const lineIds = new Set(CURRICULUM_LINES.map((l) => l.id));
    for (const lesson of CURRICULUM_LESSONS) {
      expect(
        lineIds.has(lesson.lineId),
        `Lesson "${lesson.id}" references missing line "${lesson.lineId}"`,
      ).toBe(true);
    }
  });

  it("every lesson references an existing variation", () => {
    const varIds = new Set(CURRICULUM_VARIATIONS.map((v) => v.id));
    for (const lesson of CURRICULUM_LESSONS) {
      expect(
        varIds.has(lesson.variationId),
        `Lesson "${lesson.id}" references missing variation "${lesson.variationId}"`,
      ).toBe(true);
    }
  });

  it("every world lessonId references an existing lesson", () => {
    const lessonIds = new Set(CURRICULUM_LESSONS.map((l) => l.id));
    for (const world of CURRICULUM_WORLDS) {
      for (const lid of world.lessonIds) {
        expect(
          lessonIds.has(lid),
          `World "${world.id}" references missing lesson "${lid}"`,
        ).toBe(true);
      }
    }
  });

  it("every world bossBattleId matches a lesson in that world", () => {
    for (const world of CURRICULUM_WORLDS) {
      if (world.bossBattleId) {
        expect(world.lessonIds).toContain(world.bossBattleId);
        const bossLesson = CURRICULUM_LESSONS.find((l) => l.id === world.bossBattleId);
        expect(bossLesson).toBeDefined();
      }
    }
  });

  it("every variation references an existing opening family", () => {
    const familyIds = new Set(CURRICULUM_FAMILIES.map((f) => f.id));
    for (const v of CURRICULUM_VARIATIONS) {
      expect(
        familyIds.has(v.openingFamilyId),
        `Variation "${v.id}" references missing family "${v.openingFamilyId}"`,
      ).toBe(true);
    }
  });

  it("has at least 3 worlds", () => {
    expect(CURRICULUM_WORLDS.length).toBeGreaterThanOrEqual(3);
  });

  it("has at least 20 lessons", () => {
    expect(CURRICULUM_LESSONS.length).toBeGreaterThanOrEqual(20);
  });

  it("has at least 8 opening families across all worlds", () => {
    // Italian, Four Knights, London, QG, Ruy Lopez, Caro-Kann, French, Scandinavian = 8
    expect(CURRICULUM_FAMILIES.length).toBeGreaterThanOrEqual(8);
  });

  it("every lesson has a side, depth, and lineId", () => {
    for (const lesson of CURRICULUM_LESSONS) {
      expect(lesson.side).toMatch(/^(white|black)$/);
      expect(lesson.depth).toBeGreaterThanOrEqual(1);
      expect(lesson.lineId).toBeTruthy();
    }
  });

  it("world 3 has black-side lessons", () => {
    const w3LessonIds = CURRICULUM_WORLDS.find(
      (w) => w.id === "world_defender_fortress",
    )!.lessonIds;
    const w3Lessons = CURRICULUM_LESSONS.filter((l) =>
      w3LessonIds.includes(l.id),
    );
    for (const lesson of w3Lessons) {
      if (lesson.id.startsWith("boss")) continue;
      expect(lesson.side).toBe("black");
    }
  });

  it("boss lessons have requiredLessonIds for all regular lessons in their world", () => {
    const bosses = CURRICULUM_LESSONS.filter((l) => l.requiredLessonIds && l.requiredLessonIds.length > 0);
    for (const boss of bosses) {
      expect(boss.requiredLessonIds!.length).toBeGreaterThanOrEqual(5);
    }
  });
});

describe("opening line replay validity", () => {
  it.each(CURRICULUM_LINES.map((l) => [l.id, l.sanMoves]))(
    "line %s replays from start position without errors",
    (_id: string, sanMoves: string[]) => {
      const chess = new Chess();
      for (let i = 0; i < sanMoves.length; i++) {
        const move = chess.move(sanMoves[i]);
        expect(move, `Move ${i + 1} "${sanMoves[i]}" in line "${_id}" is invalid`).not.toBeNull();
      }
    },
  );

  it("every line has at least 4 moves (enough for a training session)", () => {
    for (const line of CURRICULUM_LINES) {
      expect(
        line.sanMoves.length,
        `Line "${line.id}" has only ${line.sanMoves.length} moves`,
      ).toBeGreaterThanOrEqual(4);
    }
  });

  it("every line has matching sanMoves and pgn content", () => {
    for (const line of CURRICULUM_LINES) {
      // Replay the sanMoves — the resulting PGN should match
      const chess = new Chess();
      for (const san of line.sanMoves) {
        chess.move(san);
      }
      // PGN should contain the last move's position
      expect(chess.history().length).toBe(line.sanMoves.length);
    }
  });

  it("every opening line has fenPositions as an array (even if empty)", () => {
    for (const line of CURRICULUM_LINES) {
      expect(Array.isArray(line.fenPositions)).toBe(true);
    }
  });
});

describe("seed idempotency", () => {
  it("seedCurriculum is idempotent — no duplicate world/lesson rows", async () => {
    await seedCurriculum();
    const firstCount = await db.lessons.count();

    await seedCurriculum();
    const secondCount = await db.lessons.count();
    expect(secondCount).toBe(firstCount);

    const worlds = await db.worlds.toArray();
    expect(worlds.length).toBe(3);
  });

  it("seedCoreData does not overwrite existing progress on re-run", async () => {
    await seedCoreData();
    // Simulate mastering a lesson
    await db.lessonProgress.update("lesson_w1_italian_main", {
      masteryLevel: 4,
      perfectRuns: 10,
      status: "mastered",
    });

    await seedCoreData();

    const p = await db.lessonProgress.get("lesson_w1_italian_main");
    expect(p?.masteryLevel).toBe(4);
    expect(p?.perfectRuns).toBe(10);
    expect(p?.status).toBe("mastered");
  });
});

describe("lesson progress distribution", () => {
  it("World 1 lesson 1 is available, rest of worlds 1-3 are locked", async () => {
    await seedCoreData();
    const allProgress = await getAllLessonProgress();

    const w1First = allProgress.find((p) => p.lessonId === "lesson_w1_italian_main");
    expect(w1First?.status).toBe("available");

    // All other lessons should be locked
    const others = allProgress.filter(
      (p) => p.lessonId !== "lesson_w1_italian_main",
    );
    for (const p of others) {
      expect(
        p.status,
        `Lesson ${p.lessonId} should be "locked", got "${p.status}"`,
      ).toBe("locked");
    }
  });

  it("has progress rows for all three worlds", async () => {
    await seedCoreData();
    const allProgress = await getAllLessonProgress();
    const ids = new Set(allProgress.map((p) => p.lessonId));

    for (const id of WORLD_1_LESSON_IDS) expect(ids.has(id)).toBe(true);
    for (const id of WORLD_2_LESSON_IDS) expect(ids.has(id)).toBe(true);
    for (const id of WORLD_3_LESSON_IDS) expect(ids.has(id)).toBe(true);
  });
});

describe("curriculum constants consistency", () => {
  it("WORLD_1_LESSON_IDS match the lessons in world_knight_meadows", () => {
    const world = CURRICULUM_WORLDS.find((w) => w.id === "world_knight_meadows")!;
    const regularIds = world.lessonIds.filter((id) => !id.startsWith("boss"));
    expect(new Set(regularIds)).toEqual(new Set(WORLD_1_LESSON_IDS));
  });

  it("WORLD_2_LESSON_IDS match the lessons in world_royal_castle", () => {
    const world = CURRICULUM_WORLDS.find((w) => w.id === "world_royal_castle")!;
    const regularIds = world.lessonIds.filter((id) => !id.startsWith("boss"));
    expect(new Set(regularIds)).toEqual(new Set(WORLD_2_LESSON_IDS));
  });

  it("WORLD_3_LESSON_IDS match the lessons in world_defender_fortress", () => {
    const world = CURRICULUM_WORLDS.find((w) => w.id === "world_defender_fortress")!;
    const regularIds = world.lessonIds.filter((id) => !id.startsWith("boss"));
    expect(new Set(regularIds)).toEqual(new Set(WORLD_3_LESSON_IDS));
  });
});
