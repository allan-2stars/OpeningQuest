import { useState, useRef } from "react";
import PageShell from "../../components/PageShell.tsx";
import Card from "../../components/Card.tsx";
import Button from "../../components/Button.tsx";
import Badge from "../../components/Badge.tsx";
import FeedbackBanner from "../../components/FeedbackBanner.tsx";
import { analysisService } from "./analysisService.ts";
import type { AnalysisResult, AnalysisStatus } from "./types.ts";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const STATUS_BADGE: Record<AnalysisStatus, { variant: "default" | "success" | "warning" | "error"; label: string }> = {
  idle:        { variant: "default",  label: "Not Started" },
  loading:     { variant: "warning",  label: "Starting..." },
  ready:       { variant: "success",  label: "Ready" },
  analysing:   { variant: "warning",  label: "Analysing..." },
  error:       { variant: "error",    label: "Error" },
  terminated:  { variant: "default",  label: "Stopped" },
};

export default function AnalysisPage() {
  const [fen, setFen] = useState("");
  const [status, setStatus] = useState<AnalysisStatus>(analysisService.getStatus());
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const statusTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateStatus = () => {
    setStatus(analysisService.getStatus());
  };

  const clearResult = () => {
    setResult(null);
    setElapsedMs(null);
    setErrorText(null);
  };

  const handleLoadStartPos = () => {
    clearResult();
    setFen(START_FEN);
  };

  const handleClear = () => {
    setFen("");
    clearResult();
  };

  const handleStartEngine = async () => {
    clearResult();
    setErrorText(null);
    try {
      await analysisService.startEngine();
      updateStatus();
      // Poll status to catch ready transition during polling
      if (statusTimerRef.current) clearInterval(statusTimerRef.current);
      statusTimerRef.current = setInterval(() => {
        updateStatus();
        if (analysisService.getStatus() === "ready") {
          if (statusTimerRef.current) clearInterval(statusTimerRef.current);
          statusTimerRef.current = null;
        }
      }, 200);
    } catch (e) {
      setErrorText(e instanceof Error ? e.message : "Failed to start engine");
      updateStatus();
    }
  };

  const handleStopEngine = () => {
    analysisService.stopEngine();
    updateStatus();
    if (statusTimerRef.current) {
      clearInterval(statusTimerRef.current);
      statusTimerRef.current = null;
    }
  };

  const handleAnalyse = async () => {
    if (!fen.trim()) return;
    setErrorText(null);
    setResult(null);
    setAnalysing(true);
    updateStatus();
    const start = performance.now();

    try {
      const r = await analysisService.analysePosition(fen.trim());
      setResult(r);
      setElapsedMs(Math.round(performance.now() - start));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Analysis failed";
      setErrorText(msg);
    } finally {
      setAnalysing(false);
      updateStatus();
    }
  };

  const statusInfo = STATUS_BADGE[status];

  return (
    <PageShell title="Analysis Debug">
      <div className="flex flex-col gap-4 max-w-2xl">
        {/* Engine controls */}
        <Card header="Engine">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            <span className="text-xs text-text-muted">
              Worker: {status !== "idle" && status !== "terminated" ? "Running" : "Stopped"}
            </span>
            <div className="flex-1" />
            <Button size="sm" variant="primary" onClick={handleStartEngine} disabled={status === "loading" || status === "ready" || status === "analysing"}>
              Start Engine
            </Button>
            <Button size="sm" variant="danger" onClick={handleStopEngine} disabled={status === "idle" || status === "terminated"}>
              Stop Engine
            </Button>
          </div>
        </Card>

        {/* FEN input */}
        <Card header="Position">
          <textarea
            className="w-full h-20 rounded-lg border border-slate-600 bg-surface-dark px-3 py-2 text-sm text-text-primary placeholder:text-text-muted font-mono focus:border-secondary focus:outline-none resize-y"
            placeholder="Enter FEN or click 'Load Starting Position'"
            value={fen}
            onChange={(e) => { clearResult(); setFen(e.target.value); }}
          />
          <div className="flex gap-2 mt-2">
            <Button size="sm" variant="secondary" onClick={handleLoadStartPos}>
              Load Starting Position
            </Button>
            <Button size="sm" variant="ghost" onClick={handleClear}>
              Clear
            </Button>
            <div className="flex-1" />
            <Button
              size="sm"
              variant="primary"
              onClick={handleAnalyse}
              disabled={!fen.trim() || analysing || status === "error"}
            >
              {analysing ? "Analysing..." : "Analyse"}
            </Button>
          </div>
        </Card>

        {/* Error display */}
        {errorText && (
          <FeedbackBanner type="error" message={errorText} dismissible />
        )}

        {/* Analysis output */}
        {(result || analysing) && (
          <Card header="Analysis Output">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-text-muted">Status:</span>
                <Badge variant={analysing ? "warning" : "success"}>
                  {analysing ? "Analysing..." : "Complete"}
                </Badge>
                {elapsedMs !== null && (
                  <span className="text-xs text-text-muted ml-2">{elapsedMs}ms</span>
                )}
              </div>

              {result && (
                <>
                  <div>
                    <span className="text-text-muted">Depth: </span>
                    <span className="text-text-primary font-semibold">{result.depth}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Evaluation: </span>
                    <span className={`font-semibold ${result.evaluation >= 0 ? "text-success" : "text-error"}`}>
                      {result.evaluation >= 0 ? "+" : ""}{result.evaluation / 100}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted">Best Move: </span>
                    <span className="text-text-primary font-bold">{result.bestMove || "(none)"}</span>
                  </div>
                  {result.pv.length > 0 && (
                    <div>
                      <span className="text-text-muted">PV: </span>
                      <span className="text-text-primary font-mono text-xs">{result.pv.join(" ")}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>
        )}

        {/* Empty state */}
        {!result && !analysing && !errorText && (
          <Card>
            <p className="text-sm text-text-muted">
              Enter a FEN position and click Analyse to see engine output.
            </p>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
