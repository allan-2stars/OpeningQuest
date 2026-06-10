import { useNavigate } from "react-router-dom";
import PageShell from "../../components/PageShell.tsx";
import Card from "../../components/Card.tsx";
import Button from "../../components/Button.tsx";
import { useReviewSessionStore } from "../../stores/reviewSessionStore.ts";

export default function ReviewComplete() {
  const navigate = useNavigate();
  const { queue, totalXpEarned, endReview } = useReviewSessionStore();
  const reviewedCount = queue.length;

  const handleDone = () => {
    endReview();
    navigate("/adventure");
  };

  return (
    <PageShell title="Review Complete">
      <div className="flex flex-col items-center gap-6 max-w-sm mx-auto py-12">
        <div className="text-6xl" aria-hidden="true">⭐</div>
        <h2 className="text-2xl font-bold text-text-primary text-center">
          Reviews Complete!
        </h2>

        <Card>
          <div className="space-y-3 text-sm w-full min-w-[220px]">
            <div className="flex justify-between items-center">
              <span className="text-text-muted">Lessons Reviewed</span>
              <span className="font-semibold text-text-primary">{reviewedCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-muted">XP Earned</span>
              <span className="font-bold text-secondary">+{totalXpEarned}</span>
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-2 w-full">
          <Button onClick={handleDone}>Back to Adventure</Button>
        </div>
      </div>
    </PageShell>
  );
}
