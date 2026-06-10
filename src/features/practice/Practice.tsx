import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import PageShell from "../../components/PageShell.tsx";
import Button from "../../components/Button.tsx";
import Badge from "../../components/Badge.tsx";
import Card from "../../components/Card.tsx";
import FeedbackBanner from "../../components/FeedbackBanner.tsx";
import EmptyState from "../../components/EmptyState.tsx";
import { useTrainingSession } from "../../hooks/useTrainingSession.ts";
import { localDateString } from "../../lib/date.ts";
import type { PracticeMode } from "../../types/domain.ts";
import type { CSSProperties } from "react";

const STATUS_LABELS: Record<string, string> = {
  waiting: "Ready",
  correct: "Correct!",
  wrong: "Try Again",
  complete: "Complete!",
  failed: "Run Failed",
};

// Initial orientation from lesson side, but user can flip
function useBoardOrientation(userSide: string | undefined): [string, () => void] {
  const [flipped, setFlipped] = useState(false);
  const base = userSide === "black" ? "black" : "white";
  const orientation = flipped ? (base === "white" ? "black" : "white") : base;
  const flip = useCallback(() => setFlipped((f) => !f), []);
  return [orientation, flip];
}

function PracticeContent({ lessonId }: { lessonId: string }) {
  const [mode, setMode] = useState<PracticeMode>("guided");
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [attemptedSquares, setAttemptedSquares] = useState<Record<string, CSSProperties>>({});
  const startedRef = useRef(false);

  const { state, lessonTitle, isLoading, error, handleMove, expectedSan, result, resultProgress, rewardSummary, rewardError, startSession } =
    useTrainingSession();

  const [boardOrientation, flipBoard] = useBoardOrientation(state?.userSide);

  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      startSession(lessonId, mode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear attempted-square highlights after a delay
  useEffect(() => {
    if (Object.keys(attemptedSquares).length === 0) return;
    const timer = setTimeout(() => setAttemptedSquares({}), 1200);
    return () => clearTimeout(timer);
  }, [attemptedSquares]);

  const onPieceDrop = useCallback(
    (sourceSquare: string, targetSquare: string): boolean => {
      if (!state) return false;

      try {
        const chess = new Chess(state.fen);
        const moveResult = chess.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: targetSquare[1] === "8" || targetSquare[1] === "1" ? "q" : undefined,
        });

        if (!moveResult) {
          setAttemptedSquares({
            [sourceSquare]: { backgroundColor: "rgba(239,68,68,0.3)" },
          });
          return false;
        }

        const isExpectedMove = moveResult.san === expectedSan;
        setAttemptedSquares(
          isExpectedMove
            ? {
                [sourceSquare]: { backgroundColor: "rgba(230,180,34,0.3)" },
                [targetSquare]: { backgroundColor: "rgba(230,180,34,0.3)" },
              }
            : { [sourceSquare]: { backgroundColor: "rgba(239,68,68,0.3)" } },
        );

        handleMove(moveResult.san);
      } catch {
        setAttemptedSquares({
          [sourceSquare]: { backgroundColor: "rgba(239,68,68,0.3)" },
        });
      }

      return false;
    },
    [state, expectedSan, handleMove],
  );

  const switchMode = (newMode: PracticeMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    startSession(lessonId, newMode);
  };

  const handleTextSubmit = () => {
    const trimmed = textInput.trim();
    if (!trimmed || !state) return;
    handleMove(trimmed);
    setTextInput("");
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
          <Button variant="secondary" onClick={() => { startedRef.current = false; startSession(lessonId, mode); }}>Retry</Button>
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
  const restart = () => {
    startedRef.current = false;
    startSession(lessonId, mode);
  };

  // Determine if pieces should be draggable
  const piecesDraggable = !isTerminal;
  const boardWidth = typeof window !== "undefined"
    ? Math.max(200, Math.min(560, window.innerWidth - 48))
    : 480;

  return (
    <PageShell title={lessonTitle ?? "Practice"}>
      <div className="flex flex-col lg:flex-row gap-4 max-w-5xl">
        {/* Chessboard — central, large */}
        <div className="flex-1 flex flex-col items-center">
          <div className="w-full max-w-[560px]">
            <Chessboard
              position={state.fen}
              boardOrientation={boardOrientation as "white" | "black"}
              boardWidth={boardWidth}
              onPieceDrop={onPieceDrop}
              arePiecesDraggable={piecesDraggable}
              isDraggablePiece={() => true}
              getPositionObject={() => {}}
              onArrowsChange={() => {}}
              onDragOverSquare={() => {}}
              onMouseOutSquare={() => {}}
              onMouseOverSquare={() => {}}
              onPieceClick={() => {}}
              onPieceDragBegin={() => {}}
              onPieceDragEnd={() => {}}
              onSquareClick={() => {}}
              onSquareRightClick={() => {}}
              customBoardStyle={{ borderRadius: "8px", overflow: "hidden" }}
              customDarkSquareStyle={{ backgroundColor: "#b58863" }}
              customLightSquareStyle={{ backgroundColor: "#f0d9b5" }}
              customSquareStyles={attemptedSquares}
              customDropSquareStyle={{}}
              customPieces={{}}
              customArrows={[]}
              customPremoveDarkSquareStyle={{}}
              customPremoveLightSquareStyle={{}}
              animationDuration={200}
              showBoardNotation
            />
            <div className="flex items-center gap-2 mt-2">
              <Button size="sm" variant="ghost" onClick={flipBoard}>
                Flip Board
              </Button>
              <span className="text-xs text-text-muted">
                Playing as {boardOrientation === "white" ? "White" : "Black"} (lesson: {state.userSide})
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar — controls, feedback, results */}
        <div className="flex flex-col gap-3 w-full lg:w-72 shrink-0">
          {/* Mode selector */}
          <Card>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-text-secondary">Mode:</span>
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
            </div>
          </Card>

          {/* Progress */}
          <Card>
            <div className="text-sm space-y-1">
              <p className="text-text-secondary">
                Move {state.userMoveCount + 1} of {state.totalUserMoves}
              </p>
              <Badge variant={state.status === "complete" ? "success" : state.status === "failed" ? "error" : "default"}>
                {STATUS_LABELS[state.status] ?? state.status}
              </Badge>
            </div>
          </Card>

          {/* Text input fallback (collapsed by default) */}
          <div>
            <button
              className="text-xs text-text-muted hover:text-text-secondary underline mb-1"
              onClick={() => setShowTextInput(!showTextInput)}
            >
              {showTextInput ? "Hide text input" : "Use text input instead"}
            </button>
            {showTextInput && (
              <div className="flex gap-1 mt-1">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleTextSubmit(); }}
                  placeholder='e.g. "e4"'
                  disabled={isTerminal}
                  className="flex-1 rounded border border-slate-600 bg-surface-dark px-2 py-1 text-xs text-text-primary placeholder:text-text-muted focus:border-secondary focus:outline-none"
                />
                <Button size="sm" onClick={handleTextSubmit} disabled={!textInput.trim() || isTerminal}>
                  Play
                </Button>
              </div>
            )}
          </div>

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
              <div className="space-y-1 text-xs">
                <p><span className="text-text-muted">Completed:</span>{" "}
                  <Badge variant={result.completed ? "success" : "error"} size="sm">{result.completed ? "Yes" : "No"}</Badge>
                </p>
                <p><span className="text-text-muted">Mistakes:</span>{" "}
                  <span className="text-text-primary font-semibold">{result.mistakes}</span>
                </p>
                <p><span className="text-text-muted">Perfect Run:</span>{" "}
                  <Badge variant={result.perfectRun ? "success" : "default"} size="sm">{result.perfectRun ? "Yes" : "No"}</Badge>
                </p>
                {resultProgress && (
                  <>
                    <hr className="border-slate-700 my-1" />
                    <p><span className="text-text-muted">Total PRs:</span>{" "}
                      <span className="text-text-primary font-semibold">{resultProgress.perfectRuns}</span>
                    </p>
                    <p><span className="text-text-muted">Mastery:</span>{" "}
                      <Badge variant={resultProgress.masteryLevel >= 4 ? "success" : resultProgress.masteryLevel >= 1 ? "secondary" : "default"} size="sm">
                        {resultProgress.masteryLevel}
                      </Badge>
                    </p>
                    {resultProgress.masteryLevel >= 4 && resultProgress.nextReviewAt && (
                      <p><span className="text-text-muted">Next Review:</span>{" "}
                        <span className="text-text-primary font-semibold">{localDateString(new Date(resultProgress.nextReviewAt))}</span>
                      </p>
                    )}
                  </>
                )}
              </div>
            </Card>
          )}

          {/* Reward summary */}
          {rewardSummary && (rewardSummary.xp > 0 || rewardSummary.keys > 0 || rewardSummary.unlockedAchievementIds.length > 0) && (
            <Card header="Rewards">
              <div className="space-y-1 text-xs">
                {rewardSummary.xp > 0 && (
                  <p><span className="text-text-muted">XP Earned:</span>{" "}
                    <span className="text-secondary font-bold">+{rewardSummary.xp} XP</span>
                  </p>
                )}
                {rewardSummary.keys > 0 && (
                  <p><span className="text-text-muted">Keys Earned:</span>{" "}
                    <span className="text-warning font-bold">+{rewardSummary.keys}</span>
                  </p>
                )}
                {rewardSummary.unlockedAchievementIds.map((id) => (
                  <p key={id}><Badge variant="success" size="sm">New Achievement!</Badge></p>
                ))}
              </div>
            </Card>
          )}

          {rewardError && (
            <FeedbackBanner type="warning" message={rewardError} />
          )}

          {/* Restart */}
          {isTerminal && (
            <div className="flex flex-col gap-1">
              <Button onClick={restart}>Practice Again</Button>
              <Button
                variant="secondary"
                onClick={() => switchMode(mode === "guided" ? "instinct" : "guided")}
              >
                Switch to {mode === "guided" ? "Instinct" : "Guided"}
              </Button>
            </div>
          )}
        </div>
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
