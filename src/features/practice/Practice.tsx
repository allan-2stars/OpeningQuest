import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import PageShell from "../../components/PageShell.tsx";
import Button from "../../components/Button.tsx";
import Badge from "../../components/Badge.tsx";
import Card from "../../components/Card.tsx";
import FeedbackBanner from "../../components/FeedbackBanner.tsx";
import EmptyState from "../../components/EmptyState.tsx";
import { useTrainingSession } from "../../hooks/useTrainingSession.ts";
import type { PracticeMode } from "../../types/domain.ts";

const STATUS_LABELS: Record<string, string> = {
  waiting: "Ready",
  correct: "Correct!",
  wrong: "Try Again",
  complete: "Complete!",
  failed: "Run Failed",
};

function PracticeContent({ lessonId }: { lessonId: string }) {
  const [mode, setMode] = useState<PracticeMode>("guided");
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const startedRef = useRef(false);

  const { state, lessonTitle, isLoading, error, handleMove, result, resultProgress, startSession } =
    useTrainingSession();

  // startedRef prevents React StrictMode from double-invoking startSession on dev mount
  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      startSession(lessonId, mode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchMode = (newMode: PracticeMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    startSession(lessonId, newMode);
  };

  const onSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || !state) return;
    handleMove(trimmed);
    setInput("");
    inputRef.current?.focus();
  };

  if (isLoading) {
    return (
      <PageShell title="Practice">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-secondary border-t-transparent" />
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Practice">
        <FeedbackBanner type="error" message={error} />
        <div className="mt-4">
          <Button variant="secondary" onClick={() => startSession(lessonId, mode)}>Retry</Button>
        </div>
      </PageShell>
    );
  }

  if (!state) {
    return (
      <PageShell title="Practice">
        <EmptyState icon="♟" title="Unable to load lesson" />
      </PageShell>
    );
  }

  const isTerminal = state.status === "complete" || state.status === "failed";
  const isWaiting = state.status === "waiting";
  const canSwitchMode = isWaiting;

  return (
    <PageShell title={lessonTitle ?? "Practice"}>
      <div className="flex flex-col gap-4 max-w-2xl">
        {/* Mode selector */}
        <Card>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-semibold text-text-secondary">Mode:</span>
            <Button
              size="sm"
              variant={mode === "guided" ? "primary" : "ghost"}
              onClick={() => { if (canSwitchMode) switchMode("guided"); }}
              disabled={!canSwitchMode}
            >
              Guided
            </Button>
            <Button
              size="sm"
              variant={mode === "instinct" ? "primary" : "ghost"}
              onClick={() => { if (canSwitchMode) switchMode("instinct"); }}
              disabled={!canSwitchMode}
            >
              Instinct
            </Button>
            <div className="flex-1" />
            <Badge variant={state.status === "complete" ? "success" : state.status === "failed" ? "error" : "default"}>
              {STATUS_LABELS[state.status] ?? state.status}
            </Badge>
          </div>
        </Card>

        {/* Move input */}
        {!isTerminal && (
          <Card>
            <p className="text-sm text-text-secondary mb-2">
              Move {state.userMoveCount + 1} of {state.totalUserMoves} —{" "}
              {state.userSide === "white" ? "Playing as White" : "Playing as Black"}
            </p>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") onSubmit(); }}
                placeholder='Enter move (e.g. "e4")'
                className="flex-1 rounded-lg border border-slate-600 bg-surface-dark px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-secondary focus:outline-none"
                autoFocus
              />
              <Button onClick={onSubmit} disabled={!input.trim()}>
                Play
              </Button>
            </div>
          </Card>
        )}

        {/* Feedback from last move */}
        {state.lastFeedback && (
          <FeedbackBanner
            type={state.lastFeedback.correct ? "success" : state.lastFeedback.legal ? (state.mode === "guided" ? "warning" : "error") : "error"}
            message={state.lastFeedback.message}
            dismissible
          />
        )}

        {/* Session result */}
        {result && (
          <Card header="Session Result">
            <div className="space-y-2 text-sm">
              <p><span className="text-text-muted">Completed:</span>{" "}
                <Badge variant={result.completed ? "success" : "error"}>{result.completed ? "Yes" : "No"}</Badge>
              </p>
              <p><span className="text-text-muted">Mistakes:</span>{" "}
                <span className="text-text-primary font-semibold">{result.mistakes}</span>
              </p>
              <p><span className="text-text-muted">Perfect Run:</span>{" "}
                <Badge variant={result.perfectRun ? "success" : "default"}>{result.perfectRun ? "Yes" : "No"}</Badge>
              </p>
              <p><span className="text-text-muted">Total Moves:</span>{" "}
                <span className="text-text-primary font-semibold">{result.totalMoves}</span>
              </p>
              <p><span className="text-text-muted">Mode:</span>{" "}
                <span className="text-text-primary font-semibold capitalize">{result.mode}</span>
              </p>
              {resultProgress && (
                <>
                  <hr className="border-slate-700" />
                  <p><span className="text-text-muted">Total Perfect Runs:</span>{" "}
                    <span className="text-text-primary font-semibold">{resultProgress.perfectRuns}</span>
                  </p>
                  <p><span className="text-text-muted">Mastery Level:</span>{" "}
                    <Badge variant={resultProgress.masteryLevel >= 4 ? "success" : resultProgress.masteryLevel >= 1 ? "secondary" : "default"}>
                      {resultProgress.masteryLevel}
                    </Badge>
                  </p>
                  {resultProgress.masteryLevel >= 4 && resultProgress.nextReviewAt && (
                    <p><span className="text-text-muted">Next Review:</span>{" "}
                      <span className="text-text-primary font-semibold">{resultProgress.nextReviewAt.split("T")[0]}</span>
                    </p>
                  )}
                </>
              )}
            </div>
          </Card>
        )}

        {/* Restart */}
        {isTerminal && (
          <div className="flex gap-2">
            <Button onClick={() => startSession(lessonId, mode)}>Practice Again</Button>
            <Button
              variant="secondary"
              onClick={() => switchMode(mode === "guided" ? "instinct" : "guided")}
            >
              Switch to {mode === "guided" ? "Instinct" : "Guided"}
            </Button>
          </div>
        )}
      </div>
    </PageShell>
  );
}

export default function Practice() {
  const { lessonId } = useParams<{ lessonId?: string }>();

  if (!lessonId) {
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

  return <PracticeContent key={lessonId} lessonId={lessonId} />;
}
