import { db } from "../lib/db.ts";
import { nowISO } from "../lib/date.ts";

const BACKUP_VERSION = 1;

export type BackupData = {
  version: number;
  exportedAt: string;
  userProfile: unknown;
  lessonProgress: unknown[];
  achievements: unknown[];
  pieceSkins: unknown[];
  boardThemes: unknown[];
  worlds: unknown[];
  openingFamilies: unknown[];
  variations: unknown[];
  lessons: unknown[];
  openingLines: unknown[];
  trainingSessions: unknown[];
  dailyQuests: unknown[];
};

export type BackupResult =
  | { ok: true; data: BackupData }
  | { ok: false; error: string };

export type RestoreResult =
  | { ok: true; restored: number }
  | { ok: false; error: string };

/**
 * Export full local app data as a JSON BackupData object.
 * Reads all tables directly (this is the one exception to the
 * "no direct Dexie access from services" rule — backup is
 * a database-level operation).
 */
export async function exportBackup(): Promise<BackupResult> {
  try {
    const [
      userProfile,
      lessonProgress,
      achievements,
      pieceSkins,
      boardThemes,
      worlds,
      openingFamilies,
      variations,
      lessons,
      openingLines,
      trainingSessions,
      dailyQuests,
    ] = await Promise.all([
      db.userProfile.toArray(),
      db.lessonProgress.toArray(),
      db.achievements.toArray(),
      db.pieceSkins.toArray(),
      db.boardThemes.toArray(),
      db.worlds.toArray(),
      db.openingFamilies.toArray(),
      db.variations.toArray(),
      db.lessons.toArray(),
      db.openingLines.toArray(),
      db.trainingSessions.toArray(),
      db.dailyQuests.toArray(),
    ]);

    return {
      ok: true,
      data: {
        version: BACKUP_VERSION,
        exportedAt: nowISO(),
        userProfile: userProfile.length > 0 ? userProfile[0] : null,
        lessonProgress,
        achievements,
        pieceSkins,
        boardThemes,
        worlds,
        openingFamilies,
        variations,
        lessons,
        openingLines,
        trainingSessions,
        dailyQuests,
      },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to export backup" };
  }
}

/**
 * Import backup data through a full replacement strategy.
 * Clears all existing data and restores from the backup payload.
 * Only restores tables that have data in the backup.
 */
export async function importBackup(json: string): Promise<RestoreResult> {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return { ok: false, error: "Invalid JSON — could not parse backup file." };
  }

  if (!isValidBackupShape(data)) {
    return { ok: false, error: "Invalid backup format — missing required fields or wrong version." };
  }

  const backup = data as BackupData;

  try {
    let restored = 0;

    // Clear all tables then restore in sequence
    await Promise.all(db.tables.map((t) => t.clear()));

    // Restore user profile
    if (backup.userProfile) {
      await db.userProfile.put(backup.userProfile as never);
      restored++;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const collections: [any, unknown[] | undefined][] = [
      [db.lessonProgress, backup.lessonProgress],
      [db.achievements, backup.achievements],
      [db.pieceSkins, backup.pieceSkins],
      [db.boardThemes, backup.boardThemes],
      [db.worlds, backup.worlds],
      [db.openingFamilies, backup.openingFamilies],
      [db.variations, backup.variations],
      [db.lessons, backup.lessons],
      [db.openingLines, backup.openingLines],
      [db.trainingSessions, backup.trainingSessions],
      [db.dailyQuests, backup.dailyQuests],
    ];

    for (const [table, rows] of collections) {
      if (rows && rows.length > 0) {
        await table.bulkPut(rows as never[]);
        restored += rows.length;
      }
    }

    return { ok: true, restored };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to restore backup" };
  }
}

function isValidBackupShape(data: unknown): data is BackupData {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.version === "number" &&
    d.version >= 1 &&
    d.version <= BACKUP_VERSION &&
    Array.isArray(d.lessonProgress) &&
    Array.isArray(d.achievements) &&
    Array.isArray(d.worlds) &&
    Array.isArray(d.openingLines)
  );
}
