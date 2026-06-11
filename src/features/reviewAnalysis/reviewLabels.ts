import type { MoveClassification, ReasonCode } from "./types.ts";

export type ClassificationLabel = {
  icon: string;
  label: string;
};

const CLASSIFICATION_MAP: Record<MoveClassification, ClassificationLabel> = {
  SMART_MOVE: { icon: "⭐", label: "Smart Move" },
  GOOD_MOVE:  { icon: "👍", label: "Good Move" },
  SAFE_MOVE:  { icon: "🛡", label: "Safe Move" },
  WATCH_OUT:  { icon: "👀", label: "Watch Out" },
  OOPS:       { icon: "❌", label: "Oops" },
};

export function getClassificationLabel(c: MoveClassification): ClassificationLabel {
  return CLASSIFICATION_MAP[c];
}

const REASON_MAP: Record<ReasonCode, string> = {
  OPENING_MOVE:     "On the Opening Path",
  BEST_MOVE:        "Best Move Found",
  OPENING_EXIT:     "Left the Opening Line",
  EVAL_DROP:        "Position Became Harder",
  LARGE_EVAL_DROP:  "Position Got Much Worse",
  SOLID_MOVE:       "Safe and Sound",
  SAFE_MOVE:        "Safe Choice",
};

export function getReasonLabel(rc: ReasonCode): string {
  return REASON_MAP[rc];
}
