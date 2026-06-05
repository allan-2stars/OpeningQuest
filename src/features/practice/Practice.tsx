import { useParams } from "react-router-dom";
import PageShell from "../../components/PageShell.tsx";
import EmptyState from "../../components/EmptyState.tsx";

export default function Practice() {
  const { lessonId } = useParams<{ lessonId?: string }>();

  if (lessonId) {
    return (
      <PageShell title="Practice">
        <EmptyState
          icon="♟"
          title="Training session"
          description={`Ready to practice lesson: ${lessonId}`}
        />
      </PageShell>
    );
  }

  return (
    <PageShell title="Practice">
      <EmptyState
        icon="♟"
        title="Practice Mode"
        description="Select a lesson from the Adventure Map or Classic Mode to start practicing."
      />
    </PageShell>
  );
}
