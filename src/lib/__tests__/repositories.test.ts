import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../db.ts";
import {
  getUserProfile,
  createUserProfile,
  updateUserProfile,
} from "../repositories/userProfileRepo.ts";
import {
  getLessonProgress,
  getAllLessonProgress,
  upsertLessonProgress,
  updateLessonProgress,
} from "../repositories/lessonProgressRepo.ts";
import {
  getAllWorlds,
  getWorld,
  getLessonsByWorld,
  getVariation,
  getVariationsByFamily,
  getOpeningFamily,
  getOpeningLine,
  getLesson,
  getLessons,
} from "../repositories/curriculumRepo.ts";
import {
  getAllAchievements,
  getUnlockedAchievements,
  getAchievement,
  getAllPieceSkins,
  getUnlockedPieceSkins,
  getAllBoardThemes,
  getUnlockedBoardThemes,
} from "../repositories/rewardsRepo.ts";
import { seedCoreData } from "../seed/seed.ts";
import type {
  UserProfile,
  LessonProgress,
  World,
  Lesson,
  Variation,
  OpeningFamily,
  OpeningLine,
} from "../../types/domain.ts";

function makeProfile(overrides?: Partial<UserProfile>): UserProfile {
  return {
    id: "user_test",
    displayName: "TestKnight",
    level: 1,
    totalXp: 0,
    keys: 3,
    currentStreak: 0,
    longestStreak: 0,
    createdAt: "2026-06-04T00:00:00.000Z",
    ...overrides,
  };
}

function makeProgress(overrides?: Partial<LessonProgress>): LessonProgress {
  return {
    lessonId: "lesson_001",
    masteryLevel: 0,
    perfectRuns: 0,
    attempts: 0,
    mistakes: 0,
    status: "available",
    failedReviewCount: 0,
    ...overrides,
  };
}

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe("Database", () => {
  it("has all expected tables", () => {
    expect(db.worlds).toBeDefined();
    expect(db.openingFamilies).toBeDefined();
    expect(db.variations).toBeDefined();
    expect(db.lessons).toBeDefined();
    expect(db.openingLines).toBeDefined();
    expect(db.userProfile).toBeDefined();
    expect(db.lessonProgress).toBeDefined();
    expect(db.trainingSessions).toBeDefined();
    expect(db.achievements).toBeDefined();
    expect(db.pieceSkins).toBeDefined();
    expect(db.boardThemes).toBeDefined();
    expect(db.dailyQuests).toBeDefined();
  });
});

describe("userProfileRepo", () => {
  it("returns undefined for missing profile", async () => {
    const result = await getUserProfile("nonexistent");
    expect(result).toBeUndefined();
  });

  it("creates and reads a user profile", async () => {
    const profile = makeProfile();
    const id = await createUserProfile(profile);
    expect(id).toBe("user_test");

    const read = await getUserProfile("user_test");
    expect(read).toEqual(profile);
  });

  it("updates a user profile", async () => {
    await createUserProfile(makeProfile());

    await updateUserProfile("user_test", { level: 5, totalXp: 1200 });

    const updated = await getUserProfile("user_test");
    expect(updated?.level).toBe(5);
    expect(updated?.totalXp).toBe(1200);
    expect(updated?.displayName).toBe("TestKnight");
  });

  it("throws when updating a profile that does not exist", async () => {
    await expect(
      updateUserProfile("ghost_id", { level: 2 }),
    ).rejects.toThrow("UserProfile not found: ghost_id");
  });
});

describe("lessonProgressRepo", () => {
  it("returns undefined for missing progress", async () => {
    const result = await getLessonProgress("nonexistent");
    expect(result).toBeUndefined();
  });

  it("upserts and reads lesson progress", async () => {
    const progress = makeProgress();
    const id = await upsertLessonProgress(progress);
    expect(id).toBe("lesson_001");

    const read = await getLessonProgress("lesson_001");
    expect(read).toEqual(progress);
  });

  it("returns all lesson progress entries", async () => {
    await upsertLessonProgress(makeProgress({ lessonId: "a" }));
    await upsertLessonProgress(makeProgress({ lessonId: "b" }));

    const all = await getAllLessonProgress();
    expect(all).toHaveLength(2);
  });

  it("updates specific fields without overwriting others", async () => {
    await upsertLessonProgress(makeProgress());

    await updateLessonProgress("lesson_001", {
      masteryLevel: 3,
      status: "mastered",
    });

    const updated = await getLessonProgress("lesson_001");
    expect(updated?.masteryLevel).toBe(3);
    expect(updated?.status).toBe("mastered");
    expect(updated?.attempts).toBe(0);
  });

  it("throws when updating progress that does not exist", async () => {
    await expect(
      updateLessonProgress("ghost_lesson", { masteryLevel: 1 }),
    ).rejects.toThrow("LessonProgress not found: ghost_lesson");
  });
});

describe("seedCoreData", () => {
  it("inserts default profile, achievements, skins, and themes", async () => {
    await seedCoreData();

    const profile = await getUserProfile("user_default");
    expect(profile).toBeDefined();
    expect(profile?.displayName).toBe("Knight");

    const achievements = await getAllAchievements();
    expect(achievements.length).toBeGreaterThanOrEqual(4);

    const skins = await getAllPieceSkins();
    expect(skins.length).toBeGreaterThanOrEqual(1);

    const themes = await getAllBoardThemes();
    expect(themes.length).toBeGreaterThanOrEqual(1);
  });

  it("is idempotent — does not error on second call", async () => {
    await seedCoreData();
    await seedCoreData();

    const achievements = await getAllAchievements();
    expect(achievements.length).toBeGreaterThanOrEqual(4);
  });

  it("preserves achievement unlock state across seed calls", async () => {
    await seedCoreData();

    await db.achievements.update("ach_first_lesson", {
      unlockedAt: "2026-06-04T12:00:00.000Z",
    });

    await seedCoreData();

    const ach = await getAchievement("ach_first_lesson");
    expect(ach?.unlockedAt).toBe("2026-06-04T12:00:00.000Z");
  });

  it("seeds curriculum with worlds, lessons, and progress", async () => {
    await seedCoreData();

    const worlds = await getAllWorlds();
    expect(worlds.length).toBeGreaterThanOrEqual(3);
    const w1 = worlds.find((w) => w.name === "Knight Meadows");
    expect(w1).toBeDefined();
    expect(w1!.lessonIds.length).toBeGreaterThanOrEqual(5);

    const lessons = await db.lessons.toArray();
    expect(lessons.length).toBeGreaterThanOrEqual(20);
    // World 3 lessons should exist
    expect(lessons.find((l) => l.id === "lesson_w3_caro_main")).toBeDefined();
    expect(lessons.find((l) => l.side === "black")).toBeDefined();

    const progress = await getAllLessonProgress();
    expect(progress.length).toBeGreaterThanOrEqual(20);
    expect(progress.find((p) => p.lessonId === "lesson_w1_italian_main")?.status).toBe("available");
  });
});

describe("curriculumRepo", () => {
  const world: World = {
    id: "world_1",
    name: "Knight Meadows",
    description: "A beginner world",
    theme: "grassland",
    difficulty: "beginner",
    lessonIds: ["lesson_a", "lesson_b"],
  };

  const family: OpeningFamily = {
    id: "family_italian",
    name: "Italian Game",
    side: "white",
    variationIds: ["var_italian_main"],
  };

  const variation: Variation = {
    id: "var_italian_main",
    openingFamilyId: "family_italian",
    name: "Main Line",
    description: "Standard Italian main line",
    lessonIds: ["lesson_a"],
  };

  const lesson: Lesson = {
    id: "lesson_a",
    variationId: "var_italian_main",
    title: "Italian Game Basics",
    side: "white",
    difficulty: "beginner",
    depth: 4,
    lineId: "line_001",
  };

  const line: OpeningLine = {
    id: "line_001",
    pgn: "1. e4 e5 2. Nf3 Nc6 3. Bc4",
    sanMoves: ["e4", "e5", "Nf3", "Nc6", "Bc4"],
    fenPositions: [],
    source: "builtin",
    createdAt: "2026-06-04T00:00:00.000Z",
    updatedAt: "2026-06-04T00:00:00.000Z",
  };

  beforeEach(async () => {
    await db.worlds.put(world);
    await db.openingFamilies.put(family);
    await db.variations.put(variation);
    await db.lessons.put(lesson);
    await db.lessons.put({
      ...lesson,
      id: "lesson_b",
      title: "Italian Game - Advanced",
      depth: 8,
      lineId: "line_001",
    });
    await db.openingLines.put(line);
  });

  it("gets all worlds", async () => {
    const worlds = await getAllWorlds();
    expect(worlds).toHaveLength(1);
    expect(worlds[0].name).toBe("Knight Meadows");
  });

  it("gets a world by id", async () => {
    const w = await getWorld("world_1");
    expect(w?.theme).toBe("grassland");
  });

  it("returns undefined for missing world", async () => {
    const w = await getWorld("nope");
    expect(w).toBeUndefined();
  });

  it("gets lessons by world", async () => {
    const lessons = await getLessonsByWorld("world_1");
    expect(lessons).toHaveLength(2);
    expect(lessons.map((l) => l.id).sort()).toEqual(["lesson_a", "lesson_b"]);
  });

  it("gets a variation", async () => {
    const v = await getVariation("var_italian_main");
    expect(v?.name).toBe("Main Line");
  });

  it("gets variations by family", async () => {
    const vars = await getVariationsByFamily("family_italian");
    expect(vars).toHaveLength(1);
    expect(vars[0].id).toBe("var_italian_main");
  });

  it("gets an opening family", async () => {
    const f = await getOpeningFamily("family_italian");
    expect(f?.name).toBe("Italian Game");
  });

  it("gets an opening line", async () => {
    const l = await getOpeningLine("line_001");
    expect(l?.pgn).toBe("1. e4 e5 2. Nf3 Nc6 3. Bc4");
  });

  it("gets a lesson by id", async () => {
    const l = await getLesson("lesson_a");
    expect(l?.title).toBe("Italian Game Basics");
  });

  it("returns undefined for missing lesson", async () => {
    const l = await getLesson("missing_id");
    expect(l).toBeUndefined();
  });

  it("gets multiple lessons by ids", async () => {
    const lessons = await getLessons(["lesson_a", "lesson_b"]);
    expect(lessons).toHaveLength(2);
    expect(lessons.map((l) => l.id).sort()).toEqual(["lesson_a", "lesson_b"]);
  });

  it("getLessons silently filters out missing ids", async () => {
    const lessons = await getLessons(["lesson_a", "nonexistent"]);
    expect(lessons).toHaveLength(1);
    expect(lessons[0].id).toBe("lesson_a");
  });
});

describe("rewardsRepo", () => {
  beforeEach(async () => {
    await db.achievements.bulkPut([
      {
        id: "ach_1",
        name: "First Steps",
        description: "Complete your first lesson",
        iconUrl: "/a1.svg",
      },
      {
        id: "ach_2",
        name: "Champion",
        description: "Master a world",
        iconUrl: "/a2.svg",
        unlockedAt: "2026-06-04T00:00:00.000Z",
      },
    ]);
    await db.pieceSkins.bulkPut([
      {
        id: "skin_1",
        name: "Classic",
        description: "Standard pieces",
        pieceType: "all",
        unlocked: true,
        previewUrl: "/s1.svg",
      },
      {
        id: "skin_2",
        name: "Golden",
        description: "Shiny gold pieces",
        pieceType: "all",
        unlocked: false,
        previewUrl: "/s2.svg",
      },
    ]);
    await db.boardThemes.bulkPut([
      {
        id: "theme_1",
        name: "Classic",
        description: "Wood board",
        unlocked: true,
        previewUrl: "/t1.svg",
        lightSquareColor: "#f0d9b5",
        darkSquareColor: "#b58863",
      },
    ]);
  });

  it("gets all achievements", async () => {
    const all = await getAllAchievements();
    expect(all).toHaveLength(2);
  });

  it("gets only unlocked achievements", async () => {
    const unlocked = await getUnlockedAchievements();
    expect(unlocked).toHaveLength(1);
    expect(unlocked[0].id).toBe("ach_2");
  });

  it("gets a specific achievement", async () => {
    const a = await getAchievement("ach_1");
    expect(a?.name).toBe("First Steps");
  });

  it("gets all piece skins", async () => {
    const skins = await getAllPieceSkins();
    expect(skins).toHaveLength(2);
  });

  it("gets only unlocked piece skins", async () => {
    const unlocked = await getUnlockedPieceSkins();
    expect(unlocked).toHaveLength(1);
    expect(unlocked[0].id).toBe("skin_1");
  });

  it("gets all board themes", async () => {
    const themes = await getAllBoardThemes();
    expect(themes).toHaveLength(1);
  });

  it("gets only unlocked board themes", async () => {
    const unlocked = await getUnlockedBoardThemes();
    expect(unlocked).toHaveLength(1);
  });
});
