import type { OpeningLineStatus } from "./types.ts";

/**
 * Compare the player's move history against the expected opening line.
 * Pure function — no side effects, no engine access.
 *
 * @param openingId — identifier for the opening (usually the lessonId)
 * @param expectedMoves — the expected SAN sequence for the full lesson
 * @param playedMoves — the actual SAN moves the player has submitted (accepted only)
 */
export function evaluateOpeningLine(
  openingId: string,
  expectedMoves: string[],
  playedMoves: string[],
): OpeningLineStatus {
  const totalPly = expectedMoves.length;

  for (let i = 0; i < Math.min(expectedMoves.length, playedMoves.length); i++) {
    if (playedMoves[i] !== expectedMoves[i]) {
      return {
        openingId,
        totalPly,
        inLine: false,
        exited: true,
        exitPly: i + 1, // 1-indexed ply
        exitMoveSan: playedMoves[i],
        expectedMoveSan: expectedMoves[i],
      };
    }
  }

  // All played moves match so far
  return {
    openingId,
    totalPly,
    inLine: true,
    exited: false,
  };
}
