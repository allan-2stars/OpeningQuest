import { nowISO } from "../../lib/date.ts";
import { db } from "../../lib/db.ts";
import type { OpeningSessionResult, OpeningExitStats } from "./types.ts";

export async function saveOpeningSessionResult(
  result: OpeningSessionResult,
): Promise<void> {
  await db.openingSessionResults.put(result);
}

export async function getOpeningExitStats(): Promise<OpeningExitStats> {
  const all = await db.openingSessionResults.toArray();

  return {
    totalSessions: all.length,
    completedInLine: all.filter((r) => !r.openingExitDetected).length,
    exitedEarly: all.filter((r) => r.openingExitDetected).length,
  };
}

export async function getRecentSessionResults(
  limit = 20,
): Promise<OpeningSessionResult[]> {
  return db.openingSessionResults
    .orderBy("playedAt")
    .reverse()
    .limit(limit)
    .toArray();
}

export function buildSessionResult(
  lessonId: string,
  completed: boolean,
  exited: boolean,
  exitPly?: number,
  exitMoveSan?: string,
  expectedMoveSan?: string,
): OpeningSessionResult {
  return {
    id: `osr_${lessonId}_${Date.now()}`,
    lessonId,
    completed,
    openingExitDetected: exited,
    exitPly: exited ? exitPly : undefined,
    exitMoveSan: exited ? exitMoveSan : undefined,
    expectedMoveSan: exited ? expectedMoveSan : undefined,
    playedAt: nowISO(),
  };
}
