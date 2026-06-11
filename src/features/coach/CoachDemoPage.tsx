import { useState } from "react";
import PageShell from "../../components/PageShell.tsx";
import Card from "../../components/Card.tsx";
import CoachPanel from "./CoachPanel.tsx";
import { getCoachMessage } from "./coachService.ts";
import type { CoachMessage } from "./types.ts";
import type { MoveClassification, ReasonCode } from "../reviewAnalysis/types.ts";

const DEMO_DATA: {
  moveSan: string;
  classification: MoveClassification;
  reasonCode: ReasonCode;
}[] = [
  { moveSan: "e4",  classification: "SMART_MOVE", reasonCode: "OPENING_MOVE" },
  { moveSan: "e5",  classification: "SMART_MOVE", reasonCode: "OPENING_MOVE" },
  { moveSan: "Nf3", classification: "GOOD_MOVE",  reasonCode: "SOLID_MOVE" },
  { moveSan: "Nc6", classification: "GOOD_MOVE",  reasonCode: "SOLID_MOVE" },
  { moveSan: "Bc4", classification: "SAFE_MOVE",  reasonCode: "SAFE_MOVE" },
  { moveSan: "a4",  classification: "WATCH_OUT",  reasonCode: "OPENING_EXIT" },
  { moveSan: "Qh5", classification: "OOPS",       reasonCode: "LARGE_EVAL_DROP" },
];

export default function CoachDemoPage() {
  const [coachMessage, setCoachMessage] = useState<CoachMessage | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // Build timeline items with onClick for coach panel interaction
  const timelineItems = DEMO_DATA.map((item, idx) => ({
    moveSan: item.moveSan,
    classification: item.classification,
    reasonCode: item.reasonCode,
    onClick: () => {
      setSelectedIdx(idx);
      setCoachMessage(getCoachMessage(item.classification, item.reasonCode));
    },
  }));

  const selectedMove = selectedIdx !== null ? DEMO_DATA[selectedIdx].moveSan : null;

  return (
    <PageShell title="Coach Demo">
      <div className="flex flex-col lg:flex-row gap-4 max-w-4xl">
        {/* Left: Timeline */}
        <div className="flex-1">
          <Card header="Session Timeline">
            {timelineItems.length > 0 ? (
              <div className="rounded-xl border border-slate-700 bg-surface overflow-hidden">
                {timelineItems.map((item, idx) => (
                  <button
                    key={`${item.moveSan}-${idx}`}
                    onClick={item.onClick}
                    className={`w-full text-left flex items-center gap-3 py-3 px-4 border-b border-slate-700 last:border-b-0
                      transition-colors hover:bg-surface-light
                      ${selectedIdx === idx ? "bg-primary/10 ring-1 ring-secondary/30" : ""}`}
                  >
                    <span className="text-xl shrink-0" aria-hidden="true">
                      {item.classification === "SMART_MOVE" ? "⭐" :
                       item.classification === "GOOD_MOVE" ? "👍" :
                       item.classification === "SAFE_MOVE" ? "🛡" :
                       item.classification === "WATCH_OUT" ? "👀" : "❌"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-text-primary">{item.moveSan}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="text-3xl mb-3" aria-hidden="true">📋</span>
                <p className="text-sm font-semibold text-text-primary">No review available yet.</p>
              </div>
            )}
          </Card>
        </div>

        {/* Right: Coach Panel */}
        <div className="w-full lg:w-72 shrink-0">
          <Card header="Coach">
            {coachMessage ? (
              <div className="space-y-3">
                <CoachPanel message={coachMessage} />
                <p className="text-xs text-text-muted">
                  Move: <span className="text-text-primary font-semibold">{selectedMove}</span>
                </p>
              </div>
            ) : (
              <CoachPanel message={null} />
            )}
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
