import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageShell from "../../components/PageShell.tsx";
import Card from "../../components/Card.tsx";
import Button from "../../components/Button.tsx";
import EmptyState from "../../components/EmptyState.tsx";
import FeedbackBanner from "../../components/FeedbackBanner.tsx";
import CoachPanel from "../coach/CoachPanel.tsx";
import { getCoachMessage } from "../coach/coachService.ts";
import { getReviewResult } from "./reviewResultsRepo.ts";
import type { LessonReviewResult } from "./reviewBuilderService.ts";
import type { CoachMessage } from "../coach/types.ts";

export default function ReviewResultPage() {
  const { lessonId } = useParams<{ lessonId?: string }>();
  const navigate = useNavigate();
  const [review, setReview] = useState<LessonReviewResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!lessonId) return;
    let cancelled = false;

    (async () => {
      try {
        let result = await getReviewResult(lessonId);
        // Race guard: review may still be saving after lesson completion — retry once
        if (!result && !cancelled) {
          await new Promise<void>((r) => setTimeout(r, 500));
          if (!cancelled) result = await getReviewResult(lessonId);
        }
        if (!cancelled) setReview(result);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load review");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [lessonId]);

  if (!lessonId) {
    return (
      <PageShell title="Review">
        <EmptyState icon="📋" title="No lesson selected" />
      </PageShell>
    );
  }

  if (isLoading) {
    return (
      <PageShell title="Review">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-secondary border-t-transparent" />
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Review">
        <FeedbackBanner type="error" message={error} />
        <div className="mt-4">
          <Button variant="secondary" onClick={() => navigate("/adventure")}>
            Back to Adventure
          </Button>
        </div>
      </PageShell>
    );
  }

  if (!review) {
    return (
      <PageShell title="Review">
        <CoachPanel message={null} emptyTitle="No review available yet. Complete a lesson to generate one." />
        <div className="mt-4">
          <Button variant="secondary" onClick={() => navigate("/adventure")}>
            Back to Adventure
          </Button>
        </div>
      </PageShell>
    );
  }

  const selectedMove = selectedIndex !== null ? review.moves[selectedIndex] : null;
  const coachMessage: CoachMessage | null = selectedMove
    ? getCoachMessage(selectedMove.classification, selectedMove.reasonCode)
    : null;

  return (
    <PageShell title="How Did You Do?">
      <div className="flex flex-col lg:flex-row gap-4 max-w-5xl">
        {/* Left: Move list + summary */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <SummaryBadge icon="⭐" label="Smart" count={review.summary.smartMoves} variant="success" />
            <SummaryBadge icon="👍" label="Good" count={review.summary.goodMoves} variant="secondary" />
            <SummaryBadge icon="🛡" label="Safe" count={review.summary.safeMoves} variant="default" />
            <SummaryBadge icon="👀" label="Watch" count={review.summary.watchOuts} variant="warning" />
            <SummaryBadge icon="❌" label="Oops" count={review.summary.oopses} variant="error" />
          </div>

          {/* Interactive move list */}
          <Card header="Your Moves">
            {review.moves.length > 0 ? (
              <div className="rounded-xl border border-slate-700 bg-surface overflow-hidden">
                {review.moves.map((move, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedIndex(idx)}
                    className={`w-full text-left flex items-center gap-3 py-3 px-4 border-b border-slate-700 last:border-b-0
                      transition-colors hover:bg-surface-light
                      ${selectedIndex === idx ? "bg-primary/10 ring-1 ring-secondary/30" : ""}`}
                  >
                    <span className="text-xl shrink-0" aria-hidden="true">
                      {move.classification === "SMART_MOVE" ? "⭐" :
                       move.classification === "GOOD_MOVE" ? "👍" :
                       move.classification === "SAFE_MOVE" ? "🛡" :
                       move.classification === "WATCH_OUT" ? "👀" : "❌"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-text-primary">{move.moveSan}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted text-center py-8">No moves in this session.</p>
            )}
          </Card>
        </div>

        {/* Right: Coach panel */}
        <div className="w-full lg:w-72 shrink-0">
          <Card header="Sir Knight Says">
            {selectedMove ? (
              <div className="space-y-2">
                <CoachPanel message={coachMessage} />
                <p className="text-xs text-text-muted">
                  Move: <span className="text-text-primary font-semibold">{selectedMove.moveSan}</span>
                </p>
              </div>
            ) : (
              <CoachPanel message={null} />
            )}
          </Card>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button onClick={() => navigate("/adventure")}>Back to Adventure</Button>
        <Button variant="secondary" onClick={() => navigate(`/practice/${lessonId}`)}>
          Practice Again
        </Button>
      </div>
    </PageShell>
  );
}

function SummaryBadge({
  icon,
  label,
  count,
  variant,
}: {
  icon: string;
  label: string;
  count: number;
  variant: "success" | "secondary" | "default" | "warning" | "error";
}) {
  const colorClass =
    variant === "success" ? "text-success" :
    variant === "warning" ? "text-warning" :
    variant === "error" ? "text-error" :
    variant === "secondary" ? "text-secondary" :
    "text-text-primary";

  return (
    <div className="rounded-lg border border-slate-700 bg-surface p-3 text-center">
      <span className="text-lg" aria-hidden="true">{icon}</span>
      <p className={`text-lg font-bold ${colorClass}`}>{count}</p>
      <p className="text-[10px] text-text-muted">{label}</p>
    </div>
  );
}
