import type {
  World,
  OpeningFamily,
  Variation,
  Lesson,
  OpeningLine,
  LessonProgress,
} from "../../types/domain.ts";

// ── World 1 — Knight Meadows ──────────────────────────────────────────

export const WORLD_1_LESSON_IDS = [
  "lesson_w1_italian_main",
  "lesson_w1_italian_pianissimo",
  "lesson_w1_italian_evans",
  "lesson_w1_four_knights_main",
  "lesson_w1_four_knights_scotch",
];

export const WORLD_1_BOSS_ID = "boss_w1_knight_captain";

// ── World 2 — Royal Castle ────────────────────────────────────────────

export const WORLD_2_LESSON_IDS = [
  "lesson_w2_london_setup",
  "lesson_w2_london_dev",
  "lesson_w2_london_responses",
  "lesson_w2_qga",
  "lesson_w2_qgd",
  "lesson_w2_qg_dev",
  "lesson_w2_ruy_main",
  "lesson_w2_ruy_morphy",
];

export const WORLD_2_BOSS_ID = "boss_w2_royal_guardian";

// ── World 3 — Defender Fortress ───────────────────────────────────────

export const WORLD_3_LESSON_IDS = [
  "lesson_w3_caro_main",
  "lesson_w3_caro_classical",
  "lesson_w3_caro_exchange",
  "lesson_w3_french_main",
  "lesson_w3_french_exchange",
  "lesson_w3_scan_main",
  "lesson_w3_scan_queen",
];

export const WORLD_3_BOSS_ID = "boss_w3_fortress_commander";

// ── Worlds ─────────────────────────────────────────────────────────────

export const CURRICULUM_WORLDS: World[] = [
  {
    id: "world_knight_meadows",
    name: "Knight Meadows",
    description: "Learn open games and piece development.",
    theme: "grassland",
    difficulty: "beginner",
    lessonIds: [...WORLD_1_LESSON_IDS, WORLD_1_BOSS_ID],
    bossBattleId: WORLD_1_BOSS_ID,
  },
  {
    id: "world_royal_castle",
    name: "Royal Castle",
    description: "Master center control and classical openings.",
    theme: "castle",
    difficulty: "beginner",
    lessonIds: [...WORLD_2_LESSON_IDS, WORLD_2_BOSS_ID],
    bossBattleId: WORLD_2_BOSS_ID,
  },
  {
    id: "world_defender_fortress",
    name: "Defender Fortress",
    description: "Play Black against 1. e4 with solid defences.",
    theme: "fortress",
    difficulty: "beginner",
    lessonIds: [...WORLD_3_LESSON_IDS, WORLD_3_BOSS_ID],
    bossBattleId: WORLD_3_BOSS_ID,
  },
];

// ── Opening Families ───────────────────────────────────────────────────

export const CURRICULUM_FAMILIES: OpeningFamily[] = [
  // World 1
  {
    id: "family_italian",
    name: "Italian Game",
    side: "white",
    ecoCodes: ["C50", "C53", "C51"],
    description: "A classical opening focused on rapid development and centre control.",
    variationIds: ["var_italian_main", "var_italian_pianissimo", "var_italian_evans"],
  },
  {
    id: "family_four_knights",
    name: "Four Knights Game",
    side: "white",
    ecoCodes: ["C49", "C47"],
    description: "A solid, symmetrical opening for balanced play.",
    variationIds: ["var_four_knights_main", "var_four_knights_scotch"],
  },
  // World 2
  {
    id: "family_london",
    name: "London System",
    side: "white",
    ecoCodes: ["D02", "A46"],
    description: "A reliable system-based opening with a solid pawn structure.",
    variationIds: ["var_london_setup", "var_london_dev", "var_london_responses"],
  },
  {
    id: "family_queens_gambit",
    name: "Queen's Gambit",
    side: "white",
    ecoCodes: ["D20", "D30", "D06"],
    description: "One of the oldest and most respected openings in chess.",
    variationIds: ["var_qga", "var_qgd", "var_qg_dev"],
  },
  {
    id: "family_ruy_lopez",
    name: "Ruy Lopez",
    side: "white",
    ecoCodes: ["C60", "C78"],
    description: "The Spanish Opening — a cornerstone of classical chess.",
    variationIds: ["var_ruy_main", "var_ruy_morphy"],
  },
  // World 3 — Black defences
  {
    id: "family_caro_kann",
    name: "Caro-Kann Defence",
    side: "black",
    ecoCodes: ["B12", "B18", "B13"],
    description: "A solid defence for Black, building a strong pawn centre.",
    variationIds: ["var_caro_main", "var_caro_classical", "var_caro_exchange"],
  },
  {
    id: "family_french",
    name: "French Defence",
    side: "black",
    ecoCodes: ["C00", "C01"],
    description: "A resilient defence giving Black a solid position and counterplay.",
    variationIds: ["var_french_main", "var_french_exchange"],
  },
  {
    id: "family_scandinavian",
    name: "Scandinavian Defence",
    side: "black",
    ecoCodes: ["B01"],
    description: "An active defence that challenges White's centre immediately.",
    variationIds: ["var_scan_main", "var_scan_queen"],
  },
];

// ── Variations ─────────────────────────────────────────────────────────

export const CURRICULUM_VARIATIONS: Variation[] = [
  // World 1
  { id: "var_italian_main", openingFamilyId: "family_italian", name: "Main Line", lessonIds: ["lesson_w1_italian_main"] },
  { id: "var_italian_pianissimo", openingFamilyId: "family_italian", name: "Giuoco Pianissimo", lessonIds: ["lesson_w1_italian_pianissimo"] },
  { id: "var_italian_evans", openingFamilyId: "family_italian", name: "Evans Gambit Introduction", lessonIds: ["lesson_w1_italian_evans"] },
  { id: "var_four_knights_main", openingFamilyId: "family_four_knights", name: "Main Line", lessonIds: ["lesson_w1_four_knights_main"] },
  { id: "var_four_knights_scotch", openingFamilyId: "family_four_knights", name: "Scotch Four Knights", lessonIds: ["lesson_w1_four_knights_scotch"] },
  // World 2
  { id: "var_london_setup", openingFamilyId: "family_london", name: "Core Setup", lessonIds: ["lesson_w2_london_setup"] },
  { id: "var_london_dev", openingFamilyId: "family_london", name: "Typical Development", lessonIds: ["lesson_w2_london_dev"] },
  { id: "var_london_responses", openingFamilyId: "family_london", name: "Common Responses", lessonIds: ["lesson_w2_london_responses"] },
  { id: "var_qga", openingFamilyId: "family_queens_gambit", name: "Accepted", lessonIds: ["lesson_w2_qga"] },
  { id: "var_qgd", openingFamilyId: "family_queens_gambit", name: "Declined", lessonIds: ["lesson_w2_qgd"] },
  { id: "var_qg_dev", openingFamilyId: "family_queens_gambit", name: "Simple Development", lessonIds: ["lesson_w2_qg_dev"] },
  { id: "var_ruy_main", openingFamilyId: "family_ruy_lopez", name: "Main Line", lessonIds: ["lesson_w2_ruy_main"] },
  { id: "var_ruy_morphy", openingFamilyId: "family_ruy_lopez", name: "Morphy Defence", lessonIds: ["lesson_w2_ruy_morphy"] },
  // World 3
  { id: "var_caro_main", openingFamilyId: "family_caro_kann", name: "Main Line", lessonIds: ["lesson_w3_caro_main"] },
  { id: "var_caro_classical", openingFamilyId: "family_caro_kann", name: "Classical Setup", lessonIds: ["lesson_w3_caro_classical"] },
  { id: "var_caro_exchange", openingFamilyId: "family_caro_kann", name: "Exchange Variation", lessonIds: ["lesson_w3_caro_exchange"] },
  { id: "var_french_main", openingFamilyId: "family_french", name: "Main Line", lessonIds: ["lesson_w3_french_main"] },
  { id: "var_french_exchange", openingFamilyId: "family_french", name: "Exchange Variation", lessonIds: ["lesson_w3_french_exchange"] },
  { id: "var_scan_main", openingFamilyId: "family_scandinavian", name: "Main Line", lessonIds: ["lesson_w3_scan_main"] },
  { id: "var_scan_queen", openingFamilyId: "family_scandinavian", name: "Queen Development", lessonIds: ["lesson_w3_scan_queen"] },
];

// ── Lessons ─────────────────────────────────────────────────────────────

export const CURRICULUM_LESSONS: Lesson[] = [
  // World 1 — White-side open games
  { id: "lesson_w1_italian_main", variationId: "var_italian_main", title: "Italian Main Line", side: "white", difficulty: "beginner", depth: 4, lineId: "line_w1_italian_main" },
  { id: "lesson_w1_italian_pianissimo", variationId: "var_italian_pianissimo", title: "Giuoco Pianissimo", side: "white", difficulty: "beginner", depth: 5, lineId: "line_w1_italian_pianissimo" },
  { id: "lesson_w1_italian_evans", variationId: "var_italian_evans", title: "Evans Gambit", side: "white", difficulty: "beginner", depth: 6, lineId: "line_w1_italian_evans" },
  { id: "lesson_w1_four_knights_main", variationId: "var_four_knights_main", title: "Four Knights Main", side: "white", difficulty: "beginner", depth: 4, lineId: "line_w1_four_knights_main" },
  { id: "lesson_w1_four_knights_scotch", variationId: "var_four_knights_scotch", title: "Scotch Four Knights", side: "white", difficulty: "beginner", depth: 5, lineId: "line_w1_four_knights_scotch" },
  { id: "boss_w1_knight_captain", variationId: "var_italian_main", title: "Knight Captain", side: "white", difficulty: "beginner", depth: 6, lineId: "line_w1_boss", requiredLessonIds: [...WORLD_1_LESSON_IDS] },
  // World 2 — White-side centre control
  { id: "lesson_w2_london_setup", variationId: "var_london_setup", title: "London Core Setup", side: "white", difficulty: "beginner", depth: 4, lineId: "line_w2_london_setup" },
  { id: "lesson_w2_london_dev", variationId: "var_london_dev", title: "London Development", side: "white", difficulty: "beginner", depth: 5, lineId: "line_w2_london_dev" },
  { id: "lesson_w2_london_responses", variationId: "var_london_responses", title: "London Responses", side: "white", difficulty: "beginner", depth: 6, lineId: "line_w2_london_responses" },
  { id: "lesson_w2_qga", variationId: "var_qga", title: "QGA Accepted", side: "white", difficulty: "beginner", depth: 5, lineId: "line_w2_qga" },
  { id: "lesson_w2_qgd", variationId: "var_qgd", title: "QGD Declined", side: "white", difficulty: "beginner", depth: 5, lineId: "line_w2_qgd" },
  { id: "lesson_w2_qg_dev", variationId: "var_qg_dev", title: "QGD Development", side: "white", difficulty: "beginner", depth: 6, lineId: "line_w2_qg_dev" },
  { id: "lesson_w2_ruy_main", variationId: "var_ruy_main", title: "Ruy Lopez Main", side: "white", difficulty: "beginner", depth: 5, lineId: "line_w2_ruy_main" },
  { id: "lesson_w2_ruy_morphy", variationId: "var_ruy_morphy", title: "Morphy Defence", side: "white", difficulty: "beginner", depth: 6, lineId: "line_w2_ruy_morphy" },
  { id: "boss_w2_royal_guardian", variationId: "var_ruy_main", title: "Royal Guardian", side: "white", difficulty: "beginner", depth: 8, lineId: "line_w2_boss", requiredLessonIds: [...WORLD_2_LESSON_IDS] },
  // World 3 — Black-side defences
  { id: "lesson_w3_caro_main", variationId: "var_caro_main", title: "Caro-Kann Main Line", side: "black", difficulty: "beginner", depth: 4, lineId: "line_w3_caro_main" },
  { id: "lesson_w3_caro_classical", variationId: "var_caro_classical", title: "Caro-Kann Classical", side: "black", difficulty: "beginner", depth: 5, lineId: "line_w3_caro_classical" },
  { id: "lesson_w3_caro_exchange", variationId: "var_caro_exchange", title: "Caro-Kann Exchange", side: "black", difficulty: "beginner", depth: 4, lineId: "line_w3_caro_exchange" },
  { id: "lesson_w3_french_main", variationId: "var_french_main", title: "French Main Line", side: "black", difficulty: "beginner", depth: 4, lineId: "line_w3_french_main" },
  { id: "lesson_w3_french_exchange", variationId: "var_french_exchange", title: "French Exchange", side: "black", difficulty: "beginner", depth: 4, lineId: "line_w3_french_exchange" },
  { id: "lesson_w3_scan_main", variationId: "var_scan_main", title: "Scandinavian Main", side: "black", difficulty: "beginner", depth: 4, lineId: "line_w3_scan_main" },
  { id: "lesson_w3_scan_queen", variationId: "var_scan_queen", title: "Scandinavian Queen", side: "black", difficulty: "beginner", depth: 5, lineId: "line_w3_scan_queen" },
  { id: "boss_w3_fortress_commander", variationId: "var_caro_main", title: "Fortress Commander", side: "black", difficulty: "beginner", depth: 6, lineId: "line_w3_boss", requiredLessonIds: [...WORLD_3_LESSON_IDS] },
];

// ── Opening Lines ───────────────────────────────────────────────────────
// Every SAN array must be replayable by chess.js from the start position.

export const CURRICULUM_LINES: OpeningLine[] = [
  // World 1
  { id: "line_w1_italian_main", pgn: "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3", sanMoves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3"], fenPositions: [], source: "builtin", createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
  { id: "line_w1_italian_pianissimo", pgn: "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. d3 Nf6 5. O-O", sanMoves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "d3", "Nf6", "O-O"], fenPositions: [], source: "builtin", createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
  { id: "line_w1_italian_evans", pgn: "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5", sanMoves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "b4", "Bxb4", "c3", "Ba5"], fenPositions: [], source: "builtin", createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
  { id: "line_w1_four_knights_main", pgn: "1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. Bb5", sanMoves: ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6", "Bb5"], fenPositions: [], source: "builtin", createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
  { id: "line_w1_four_knights_scotch", pgn: "1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. d4 exd4 5. Nxd4", sanMoves: ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6", "d4", "exd4", "Nxd4"], fenPositions: [], source: "builtin", createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
  { id: "line_w1_boss", pgn: "1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d3 Bc5 5. O-O O-O 6. Re1", sanMoves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "d3", "Bc5", "O-O", "O-O", "Re1"], fenPositions: [], source: "builtin", createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
  // World 2
  { id: "line_w2_london_setup", pgn: "1. d4 d5 2. Bf4 Nf6 3. e3 e6 4. Nf3", sanMoves: ["d4", "d5", "Bf4", "Nf6", "e3", "e6", "Nf3"], fenPositions: [], source: "builtin", createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
  { id: "line_w2_london_dev", pgn: "1. d4 d5 2. Bf4 Nf6 3. e3 e6 4. Nf3 c5 5. c3", sanMoves: ["d4", "d5", "Bf4", "Nf6", "e3", "e6", "Nf3", "c5", "c3"], fenPositions: [], source: "builtin", createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
  { id: "line_w2_london_responses", pgn: "1. d4 d5 2. Bf4 c5 3. e3 Nc6 4. c3 Qb6 5. Qb3", sanMoves: ["d4", "d5", "Bf4", "c5", "e3", "Nc6", "c3", "Qb6", "Qb3"], fenPositions: [], source: "builtin", createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
  { id: "line_w2_qga", pgn: "1. d4 d5 2. c4 dxc4 3. e3 Nf6 4. Bxc4", sanMoves: ["d4", "d5", "c4", "dxc4", "e3", "Nf6", "Bxc4"], fenPositions: [], source: "builtin", createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
  { id: "line_w2_qgd", pgn: "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5", sanMoves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5"], fenPositions: [], source: "builtin", createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
  { id: "line_w2_qg_dev", pgn: "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3 Be7 5. Bf4", sanMoves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Nf3", "Be7", "Bf4"], fenPositions: [], source: "builtin", createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
  { id: "line_w2_ruy_main", pgn: "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O", sanMoves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O"], fenPositions: [], source: "builtin", createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
  { id: "line_w2_ruy_morphy", pgn: "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3", sanMoves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1", "b5", "Bb3"], fenPositions: [], source: "builtin", createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
  { id: "line_w2_boss", pgn: "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3", sanMoves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1", "b5", "Bb3", "d6", "c3"], fenPositions: [], source: "builtin", createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
  // World 3 — Black defences (user plays Black, engine plays White's moves)
  { id: "line_w3_caro_main", pgn: "1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4", sanMoves: ["e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4"], fenPositions: [], source: "builtin", createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
  { id: "line_w3_caro_classical", pgn: "1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Bf5 5. Ng3 Bg6", sanMoves: ["e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Bf5", "Ng3", "Bg6"], fenPositions: [], source: "builtin", createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
  { id: "line_w3_caro_exchange", pgn: "1. e4 c6 2. d4 d5 3. exd5 cxd5 4. Bd3", sanMoves: ["e4", "c6", "d4", "d5", "exd5", "cxd5", "Bd3"], fenPositions: [], source: "builtin", createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
  { id: "line_w3_french_main", pgn: "1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5", sanMoves: ["e4", "e6", "d4", "d5", "Nc3", "Nf6", "Bg5"], fenPositions: [], source: "builtin", createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
  { id: "line_w3_french_exchange", pgn: "1. e4 e6 2. d4 d5 3. exd5 exd5 4. Nf3", sanMoves: ["e4", "e6", "d4", "d5", "exd5", "exd5", "Nf3"], fenPositions: [], source: "builtin", createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
  { id: "line_w3_scan_main", pgn: "1. e4 d5 2. exd5 Qxd5 3. Nc3 Qa5 4. d4", sanMoves: ["e4", "d5", "exd5", "Qxd5", "Nc3", "Qa5", "d4"], fenPositions: [], source: "builtin", createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
  { id: "line_w3_scan_queen", pgn: "1. e4 d5 2. exd5 Qxd5 3. Nc3 Qd6 4. d4 Nf6 5. Nf3", sanMoves: ["e4", "d5", "exd5", "Qxd5", "Nc3", "Qd6", "d4", "Nf6", "Nf3"], fenPositions: [], source: "builtin", createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
  { id: "line_w3_boss", pgn: "1. e4 c6 2. d4 d5 3. e5 Bf5 4. Nf3 e6 5. Be2 c5 6. O-O", sanMoves: ["e4", "c6", "d4", "d5", "e5", "Bf5", "Nf3", "e6", "Be2", "c5", "O-O"], fenPositions: [], source: "builtin", createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
];

// ── Default Lesson Progress ────────────────────────────────────────────

export function makeDefaultLessonProgress(): LessonProgress[] {
  const progress: LessonProgress[] = [];

  // World 1 — first lesson available and current, rest locked
  progress.push({ lessonId: "lesson_w1_italian_main", masteryLevel: 0, perfectRuns: 0, attempts: 0, mistakes: 0, status: "available", failedReviewCount: 0 });
  for (const id of WORLD_1_LESSON_IDS.slice(1)) {
    progress.push({ lessonId: id, masteryLevel: 0, perfectRuns: 0, attempts: 0, mistakes: 0, status: "locked", failedReviewCount: 0 });
  }
  progress.push({ lessonId: WORLD_1_BOSS_ID, masteryLevel: 0, perfectRuns: 0, attempts: 0, mistakes: 0, status: "locked", failedReviewCount: 0 });

  // World 2 — all locked until World 1 is complete
  for (const id of WORLD_2_LESSON_IDS) {
    progress.push({ lessonId: id, masteryLevel: 0, perfectRuns: 0, attempts: 0, mistakes: 0, status: "locked", failedReviewCount: 0 });
  }
  progress.push({ lessonId: WORLD_2_BOSS_ID, masteryLevel: 0, perfectRuns: 0, attempts: 0, mistakes: 0, status: "locked", failedReviewCount: 0 });

  // World 3 — all locked until World 2 is complete
  for (const id of WORLD_3_LESSON_IDS) {
    progress.push({ lessonId: id, masteryLevel: 0, perfectRuns: 0, attempts: 0, mistakes: 0, status: "locked", failedReviewCount: 0 });
  }
  progress.push({ lessonId: WORLD_3_BOSS_ID, masteryLevel: 0, perfectRuns: 0, attempts: 0, mistakes: 0, status: "locked", failedReviewCount: 0 });

  return progress;
}
