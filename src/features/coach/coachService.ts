import type { CoachMessage, CoachCharacter, CoachCharacterMeta } from "./types.ts";
import type { MoveClassification, ReasonCode } from "../reviewAnalysis/types.ts";

type TemplateKey = `${MoveClassification}_${ReasonCode}` | `${MoveClassification}` | "DEFAULT";

const TEMPLATES: Partial<Record<TemplateKey, Pick<CoachMessage, "title" | "message">>> = {
  // ── SMART_MOVE variants ──
  SMART_MOVE_OPENING_MOVE: {
    title: "Great Job!",
    message: "You stayed on the opening path.",
  },
  SMART_MOVE_BEST_MOVE: {
    title: "Excellent!",
    message: "You found the best move.",
  },
  SMART_MOVE_SOLID_MOVE: { title: "Great Job!", message: "You know your openings well!" },
  SMART_MOVE: { title: "Smart Move!", message: "That was a clever choice!" },

  // ── GOOD_MOVE ──
  GOOD_MOVE: { title: "Nice Move!", message: "Your pieces are in great shape!" },

  // ── SAFE_MOVE ──
  SAFE_MOVE: { title: "Safe Choice!", message: "Nothing dangerous happened here." },

  // ── WATCH_OUT variants ──
  WATCH_OUT_OPENING_EXIT: {
    title: "Watch Out!",
    message: "You left the opening path here. Try following the lesson path.",
  },
  WATCH_OUT_EVAL_DROP: {
    title: "Careful!",
    message: "This move made the position harder.",
  },
  WATCH_OUT: { title: "Watch Out!", message: "Be careful with this move." },

  // ── OOPS ──
  OOPS: {
    title: "Oops!",
    message: "This move made the position much harder. Let's try a different move.",
  },

  // ── Default ──
  DEFAULT: {
    title: "Keep Going!",
    message: "Every move is a chance to learn.",
  },
};

function templateKey(
  classification: MoveClassification,
  reasonCode?: ReasonCode,
): TemplateKey {
  if (reasonCode) {
    const specific = `${classification}_${reasonCode}` as TemplateKey;
    if (TEMPLATES[specific]) return specific;
  }
  const generic = classification as TemplateKey;
  if (TEMPLATES[generic]) return generic;
  return "DEFAULT";
}

export function getCoachMessage(
  classification: MoveClassification,
  reasonCode?: ReasonCode,
): CoachMessage {
  const key = templateKey(classification, reasonCode);
  const tpl = TEMPLATES[key] ?? TEMPLATES["DEFAULT"]!;
  return {
    character: "SIR_KNIGHT",
    title: tpl.title,
    message: tpl.message,
  };
}

const CHARACTERS: Record<CoachCharacter, CoachCharacterMeta> = {
  SIR_KNIGHT: { name: "Sir Knight", avatar: "🐴" },
};

export function getCoachCharacter(character: CoachCharacter): CoachCharacterMeta {
  return CHARACTERS[character];
}
