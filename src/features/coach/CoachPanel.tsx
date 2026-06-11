import type { CoachMessage } from "./types.ts";
import { getCoachCharacter } from "./coachService.ts";

export default function CoachPanel({
  message,
  emptyTitle = "Choose a move to see coaching advice.",
}: {
  message: CoachMessage | null;
  emptyTitle?: string;
}) {
  const defaultChar = getCoachCharacter("SIR_KNIGHT");

  if (!message) {
    return (
      <div className="rounded-xl border border-dashed border-slate-600 p-6 text-center">
        <span className="text-3xl mb-2 block" aria-hidden="true">{defaultChar.avatar}</span>
        <p className="text-sm text-text-primary font-semibold">{defaultChar.name}</p>
        <p className="text-xs text-text-muted mt-1">{emptyTitle}</p>
      </div>
    );
  }

  const char = getCoachCharacter(message.character);

  return (
    <div className="rounded-xl border border-slate-700 bg-surface overflow-hidden">
      <div className="border-b border-slate-700 px-4 py-2 flex items-center gap-2">
        <span className="text-lg" aria-hidden="true">{char.avatar}</span>
        <span className="text-sm font-semibold text-text-secondary">{char.name}</span>
      </div>
      <div className="px-4 py-3">
        <p className="text-sm font-bold text-text-primary mb-1">{message.title}</p>
        <p className="text-sm text-text-secondary">{message.message}</p>
      </div>
    </div>
  );
}
