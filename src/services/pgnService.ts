import { Chess } from "chess.js";
import type { OpeningLine, LineSource } from "../types/domain.ts";
import { nowISO } from "../lib/date.ts";

export type PgnParseResult =
  | { ok: true; line: OpeningLine }
  | { ok: false; error: string };

/**
 * Parse a PGN text string into an OpeningLine.
 * Validates all moves through chess.js and returns sanMoves.
 */
export function parsePgn(pgnText: string, source: LineSource = "imported"): PgnParseResult {
  const trimmed = pgnText.trim();
  if (!trimmed) {
    return { ok: false, error: "PGN text is empty." };
  }

  const chess = new Chess();
  try {
    chess.loadPgn(trimmed);
  } catch {
    return { ok: false, error: "Invalid PGN — could not parse moves." };
  }

  const history = chess.history();
  if (history.length === 0) {
    return { ok: false, error: "PGN contains no moves." };
  }

  // Validate every move replays cleanly
  const verify = new Chess();
  for (const san of history) {
    try {
      verify.move(san);
    } catch {
      return { ok: false, error: `Invalid move in PGN: ${san}` };
    }
  }

  // Extract header info for the opening name
  const header = chess.header();
  const openingName = header.Opening || header.ECO || "Imported Opening";

  // Build FEN positions array
  const fenPositions: string[] = [];
  const replay = new Chess();
  for (const san of history) {
    replay.move(san);
    fenPositions.push(replay.fen());
  }

  // Generate cleaned PGN output (normalised header + moves)
  const cleanPgn = buildPgnString(history, openingName);

  const now = nowISO();
  const id = `line_imported_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return {
    ok: true,
    line: {
      id,
      pgn: cleanPgn,
      sanMoves: history,
      fenPositions,
      source,
      createdAt: now,
      updatedAt: now,
    },
  };
}

/**
 * Export an OpeningLine to PGN text with standard headers.
 * Uses "*" as Result for training lines.
 */
export function exportPgn(line: OpeningLine, openingName?: string): string {
  return buildPgnString(line.sanMoves, openingName ?? "Opening Quest Line");
}

function buildPgnString(sanMoves: string[], openingName: string): string {
  const headers = [
    `[Event "${escapePgnValue(openingName)}"]`,
    `[Site "Opening Quest"]`,
    `[Date "${nowISO().slice(0, 10).replace(/-/g, ".")}"]`,
    `[Round "?"]`,
    `[White "Player"]`,
    `[Black "Opponent"]`,
    `[Result "*"]`,
  ];

  // Wrap moves at ~80 chars
  const moveText = sanMoves.join(" ");
  const wrapped: string[] = [];
  for (let i = 0; i < moveText.length; i += 78) {
    wrapped.push(moveText.slice(i, i + 78));
  }

  return `${headers.join("\n")}\n\n${wrapped.join("\n")} *`;
}

function escapePgnValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
