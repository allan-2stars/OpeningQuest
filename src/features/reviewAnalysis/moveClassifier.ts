import type { MoveClassificationResult, ClassifierInput } from "./types.ts";

/**
 * Classify a single move according to deterministic rules.
 * Pure function — no side effects, no engine, no DB.
 *
 * Rules (first match wins):
 * 1. moveSan === expectedMoveSan → SMART_MOVE / OPENING_MOVE
 * 2. moveSan === bestMoveSan → SMART_MOVE / BEST_MOVE
 * 3. openingExitDetected → WATCH_OUT / OPENING_EXIT
 * 4. evaluationDrop >= 150 → OOPS / LARGE_EVAL_DROP
 * 5. evaluationDrop >= 50 → WATCH_OUT / EVAL_DROP
 * 6. evaluationDrop < 30 → GOOD_MOVE / SOLID_MOVE
 * 7. Fallback → SAFE_MOVE / SAFE_MOVE
 */
export function classifyMove(input: ClassifierInput): MoveClassificationResult {
  const {
    moveSan,
    expectedMoveSan,
    bestMoveSan,
    evaluationBefore,
    evaluationAfter,
    openingExitDetected,
  } = input;

  // Rule 1: Opening book move
  if (expectedMoveSan !== undefined && moveSan === expectedMoveSan) {
    return { moveSan, classification: "SMART_MOVE", reasonCode: "OPENING_MOVE" };
  }

  // Rule 2: Best move per engine
  if (bestMoveSan !== undefined && moveSan === bestMoveSan) {
    return { moveSan, classification: "SMART_MOVE", reasonCode: "BEST_MOVE" };
  }

  // Rule 3: Opening exit detected
  if (openingExitDetected) {
    return { moveSan, classification: "WATCH_OUT", reasonCode: "OPENING_EXIT" };
  }

  // Rules 4-6: Evaluation-based — require both values to be defined
  const hasEvaluation = evaluationBefore !== undefined && evaluationAfter !== undefined;
  if (hasEvaluation) {
    const drop = Math.abs(evaluationBefore! - evaluationAfter!);

    if (drop >= 150) {
      return { moveSan, classification: "OOPS", reasonCode: "LARGE_EVAL_DROP" };
    }
    if (drop >= 50) {
      return { moveSan, classification: "WATCH_OUT", reasonCode: "EVAL_DROP" };
    }
    if (drop < 30) {
      return { moveSan, classification: "GOOD_MOVE", reasonCode: "SOLID_MOVE" };
    }
  }

  // Rule 7: Fallback
  return { moveSan, classification: "SAFE_MOVE", reasonCode: "SAFE_MOVE" };
}
