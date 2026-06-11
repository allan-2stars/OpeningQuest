import type { MoveClassification, ReasonCode } from "./types.ts";
import { getClassificationLabel, getReasonLabel } from "./reviewLabels.ts";

export type ReviewedMoveViewModel = {
  moveSan: string;
  classification: MoveClassification;
  reasonCode: ReasonCode;
};

function ReviewTimelineItem({ item }: { item: ReviewedMoveViewModel }) {
  const classLabel = getClassificationLabel(item.classification);
  const reasonLabel = getReasonLabel(item.reasonCode);

  return (
    <div className="flex items-center gap-3 py-3 px-4 border-b border-slate-700 last:border-b-0">
      <span className="text-xl shrink-0" aria-hidden="true">{classLabel.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-text-primary">{item.moveSan}</p>
        <p className="text-xs text-text-secondary">{classLabel.label} · {reasonLabel}</p>
      </div>
    </div>
  );
}

export default function ReviewTimeline({
  items,
  emptyMessage = "No review available yet.",
  emptyDescription = "Complete a lesson to generate a review timeline.",
}: {
  items: ReviewedMoveViewModel[];
  emptyMessage?: string;
  emptyDescription?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <span className="text-3xl mb-3" aria-hidden="true">📋</span>
        <p className="text-sm font-semibold text-text-primary">{emptyMessage}</p>
        <p className="text-xs text-text-muted mt-1">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-surface overflow-hidden">
      {items.map((item, idx) => (
        <ReviewTimelineItem key={`${item.moveSan}-${idx}`} item={item} />
      ))}
    </div>
  );
}
