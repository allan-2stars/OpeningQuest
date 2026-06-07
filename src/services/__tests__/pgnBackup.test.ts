import { describe, it, expect, beforeEach } from "vitest";
import { Chess } from "chess.js";
import { db } from "../../lib/db.ts";
import { parsePgn, exportPgn } from "../pgnService.ts";
import { exportBackup, importBackup } from "../backupService.ts";
import {
  addImportedOpening,
  getImportedLines,
} from "../../lib/repositories/customOpeningRepo.ts";
import { seedCoreData } from "../../lib/seed/seed.ts";
import { getUserProfile } from "../../lib/repositories/userProfileRepo.ts";
import { getAllLessonProgress } from "../../lib/repositories/lessonProgressRepo.ts";

const VALID_PGN = [
  '[Event "Test Opening"]',
  '[Site "Opening Quest"]',
  '[Date "2026.06.08"]',
  '[Round "?"]',
  '[White "Player"]',
  '[Black "Opponent"]',
  '[Result "*"]',
  "",
  "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 *",
].join("\n");

const MINIMAL_PGN = "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3";

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe("pgnService — parsePgn", () => {
  it("parses valid PGN with headers", () => {
    const result = parsePgn(VALID_PGN);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.line.sanMoves).toEqual(["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3"]);
    expect(result.line.source).toBe("imported");
    expect(result.line.fenPositions.length).toBe(7);
  });

  it("parses minimal PGN (just moves, no headers)", () => {
    const result = parsePgn(MINIMAL_PGN);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.line.sanMoves.length).toBe(7);
  });

  it("returns error for empty PGN", () => {
    const result = parsePgn("");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.error).toContain("empty");
  });

  it("returns error for invalid PGN", () => {
    const result = parsePgn("1. e4 !!invalid!!");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.error).toBeTruthy();
  });

  it("returns error for PGN with illegal moves", () => {
    const result = parsePgn("1. e4 e5 2. Qz9"); // impossible move
    expect(result.ok).toBe(false);
  });

  it("returns error for PGN with no moves", () => {
    const result = parsePgn("*");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.error).toContain("no moves");
  });

  it("generates a unique ID for each import", () => {
    const r1 = parsePgn(MINIMAL_PGN);
    const r2 = parsePgn(MINIMAL_PGN);
    if (!r1.ok || !r2.ok) throw new Error("expected ok");
    expect(r1.line.id).not.toBe(r2.line.id);
  });

  it("replays the parsed line through chess.js without errors", () => {
    const result = parsePgn(VALID_PGN);
    if (!result.ok) throw new Error("expected ok");
    const chess = new Chess();
    for (const san of result.line.sanMoves) {
      expect(() => chess.move(san)).not.toThrow();
    }
  });

  it("accepts source=user for custom openings", () => {
    const result = parsePgn(MINIMAL_PGN, "user");
    if (!result.ok) throw new Error("expected ok");
    expect(result.line.source).toBe("user");
  });
});

describe("pgnService — exportPgn", () => {
  it("produces valid PGN text that can be re-imported", () => {
    const imported = parsePgn(MINIMAL_PGN);
    if (!imported.ok) throw new Error("expected ok");

    const exported = exportPgn(imported.line, "Test Export");
    // Re-parse the exported PGN
    const reimported = parsePgn(exported);
    expect(reimported.ok).toBe(true);
    if (!reimported.ok) throw new Error("expected ok");
    expect(reimported.line.sanMoves).toEqual(imported.line.sanMoves);
  });

  it("includes standard PGN headers", () => {
    const imported = parsePgn(MINIMAL_PGN);
    if (!imported.ok) throw new Error("expected ok");
    const exported = exportPgn(imported.line, "My Opening");
    expect(exported).toContain('[Event "My Opening"]');
    expect(exported).toContain('[Site "Opening Quest"]');
    expect(exported).toContain('[Result "*"]');
  });

  it("produces PGN that chess.js can load", () => {
    const imported = parsePgn(MINIMAL_PGN);
    if (!imported.ok) throw new Error("expected ok");
    const exported = exportPgn(imported.line);
    const chess = new Chess();
    expect(() => chess.loadPgn(exported)).not.toThrow();
  });
});

describe("customOpeningRepo", () => {
  it("stores an imported opening and retrieves it", async () => {
    const parsed = parsePgn(MINIMAL_PGN);
    if (!parsed.ok) throw new Error("expected ok");

    const lessonId = await addImportedOpening(parsed.line, "My Italian", "white");
    expect(lessonId).toBeTruthy();

    const lines = await getImportedLines();
    expect(lines.length).toBe(1);
    expect(lines[0].sanMoves).toEqual(parsed.line.sanMoves);
    expect(lines[0].source).toBe("imported");
  });

  it("creates a lesson that can be loaded for practice", async () => {
    const parsed = parsePgn(MINIMAL_PGN);
    if (!parsed.ok) throw new Error("expected ok");

    const lessonId = await addImportedOpening(parsed.line, "My Opening", "black");
    const lesson = await db.lessons.get(lessonId);
    expect(lesson).toBeDefined();
    expect(lesson!.side).toBe("black");
    expect(lesson!.lineId).toBe(parsed.line.id);
  });

  it("only returns non-builtin lines from getImportedLines", async () => {
    // Seed built-in curriculum
    await seedCoreData();
    const beforeCount = (await getImportedLines()).length;
    expect(beforeCount).toBe(0); // All builtin

    // Add a custom line
    const parsed = parsePgn(MINIMAL_PGN);
    if (!parsed.ok) throw new Error("expected ok");
    await addImportedOpening(parsed.line, "Custom", "white");

    const after = await getImportedLines();
    expect(after.length).toBe(1);
  });
});

describe("backupService", () => {
  it("exports valid JSON with version and timestamp", async () => {
    await seedCoreData();
    const result = await exportBackup();
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.data.version).toBe(1);
    expect(result.data.exportedAt).toBeTruthy();
    expect(Array.isArray(result.data.lessonProgress)).toBe(true);
    expect(Array.isArray(result.data.worlds)).toBe(true);
  });

  it("exports user profile and achievements", async () => {
    await seedCoreData();
    const result = await exportBackup();
    if (!result.ok) throw new Error("expected ok");

    const profile = result.data.userProfile as Record<string, unknown> | null;
    expect(profile).toBeTruthy();
    expect(profile?.displayName).toBe("Knight");

    expect(result.data.achievements.length).toBeGreaterThanOrEqual(4);
  });

  it("round-trip: export then restore preserves data", async () => {
    await seedCoreData();

    // Record pre-export state
    const preProgress = await getAllLessonProgress();
    const preProfile = await getUserProfile("user_default");

    // Export
    const exportResult = await exportBackup();
    if (!exportResult.ok) throw new Error("expected ok");
    const json = JSON.stringify(exportResult.data);

    // Wipe DB
    await db.delete();
    await db.open();

    // Restore
    const restoreResult = await importBackup(json);
    expect(restoreResult.ok).toBe(true);
    if (!restoreResult.ok) throw new Error("expected ok");
    expect(restoreResult.restored).toBeGreaterThan(0);

    // Verify
    const postProgress = await getAllLessonProgress();
    expect(postProgress.length).toBe(preProgress.length);

    const postProfile = await getUserProfile("user_default");
    expect(postProfile?.displayName).toBe(preProfile?.displayName);
    expect(postProfile?.totalXp).toBe(preProfile?.totalXp);
  });

  it("rejects invalid JSON", async () => {
    const result = await importBackup("not json {{");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.error).toContain("Invalid JSON");
  });

  it("rejects JSON with missing required shape", async () => {
    const result = await importBackup('{"version": 1}');
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.error).toContain("Invalid backup format");
  });

  it("rejects JSON with wrong version", async () => {
    const result = await importBackup('{"version": 99, "lessonProgress": [], "achievements": [], "worlds": [], "openingLines": []}');
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.error).toContain("version");
  });
});
