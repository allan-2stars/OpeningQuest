import PageShell from "../../components/PageShell.tsx";
import Card from "../../components/Card.tsx";
import ReviewTimeline from "./ReviewTimeline.tsx";
import type { ReviewedMoveViewModel } from "./ReviewTimeline.tsx";

const DEMO_DATA: ReviewedMoveViewModel[] = [
  { moveSan: "e4",  classification: "SMART_MOVE", reasonCode: "OPENING_MOVE" },
  { moveSan: "e5",  classification: "SMART_MOVE", reasonCode: "OPENING_MOVE" },
  { moveSan: "Nf3", classification: "GOOD_MOVE",  reasonCode: "SOLID_MOVE" },
  { moveSan: "Nc6", classification: "GOOD_MOVE",  reasonCode: "SOLID_MOVE" },
  { moveSan: "Bc4", classification: "SAFE_MOVE",  reasonCode: "SAFE_MOVE" },
  { moveSan: "a4",  classification: "WATCH_OUT",  reasonCode: "OPENING_EXIT" },
  { moveSan: "Qh5", classification: "OOPS",       reasonCode: "LARGE_EVAL_DROP" },
];

export default function ReviewDemoPage() {
  return (
    <PageShell title="Review Demo">
      <div className="flex flex-col gap-4 max-w-2xl">
        <Card header="Sample Review Timeline">
          <ReviewTimeline items={DEMO_DATA} />
        </Card>

        <Card header="Empty State">
          <ReviewTimeline items={[]} />
        </Card>
      </div>
    </PageShell>
  );
}
