import { useState } from "react";
import PageShell from "../../components/PageShell.tsx";
import Card from "../../components/Card.tsx";
import Button from "../../components/Button.tsx";
import Badge from "../../components/Badge.tsx";
import FeedbackBanner from "../../components/FeedbackBanner.tsx";
import { parsePgn } from "../../services/pgnService.ts";
import { exportPgn } from "../../services/pgnService.ts";
import { exportBackup, importBackup } from "../../services/backupService.ts";
import { addImportedOpening, getImportedLines } from "../../lib/repositories/customOpeningRepo.ts";
import type { Side } from "../../types/domain.ts";
import type { OpeningLine } from "../../types/domain.ts";

type Tab = "import" | "export" | "backup";

export default function ImportExport() {
  const [tab, setTab] = useState<Tab>("import");
  const [pgnText, setPgnText] = useState("");
  const [side, setSide] = useState<Side>("white");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [importedLines, setImportedLines] = useState<OpeningLine[]>([]);
  const [loadedLines, setLoadedLines] = useState(false);

  const loadLines = async () => {
    try {
      const lines = await getImportedLines();
      setImportedLines(lines);
    } catch {
      // best-effort
    }
    setLoadedLines(true);
  };

  if (!loadedLines) {
    loadLines();
  }

  const handleImport = async () => {
    setResult(null);
    const parsed = parsePgn(pgnText);
    if (!parsed.ok) {
      setResult({ ok: false, message: parsed.error });
      return;
    }

    try {
      const lessonId = await addImportedOpening(parsed.line, "Imported Opening", side);
      setResult({ ok: true, message: `Imported successfully. Lesson ID: ${lessonId}` });
      setPgnText("");
      loadLines();
    } catch (e) {
      setResult({ ok: false, message: e instanceof Error ? e.message : "Failed to save imported opening." });
    }
  };

  const handleExportLine = (line: OpeningLine) => {
    const pgn = exportPgn(line);
    navigator.clipboard.writeText(pgn).then(() => {
      setResult({ ok: true, message: "PGN copied to clipboard." });
    }).catch(() => {
      setResult({ ok: false, message: "Failed to copy to clipboard." });
    });
  };

  const handleBackupExport = async () => {
    setResult(null);
    const backupResult = await exportBackup();
    if (!backupResult.ok) {
      setResult({ ok: false, message: backupResult.error });
      return;
    }
    const json = JSON.stringify(backupResult.data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `opening-quest-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setResult({ ok: true, message: "Backup downloaded." });
  };

  const handleBackupRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setResult(null);
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const restoreResult = await importBackup(text);
      if (!restoreResult.ok) {
        setResult({ ok: false, message: restoreResult.error });
      } else {
        setResult({ ok: true, message: "Backup restored. Reload the page to see changes." });
      }
    } catch {
      setResult({ ok: false, message: "Failed to read backup file." });
    }

    // Reset the input so the same file can be re-selected
    e.target.value = "";
  };

  return (
    <PageShell title="Import / Export">
      <div className="flex flex-col gap-4 max-w-2xl">
        {/* Tab selector */}
        <Card>
          <div className="flex gap-2">
            {(["import", "export", "backup"] as Tab[]).map((t) => (
              <Button
                key={t}
                size="sm"
                variant={tab === t ? "primary" : "ghost"}
                onClick={() => { setTab(t); setResult(null); }}
              >
                {t === "import" ? "Import PGN" : t === "export" ? "Export PGN" : "Backup"}
              </Button>
            ))}
          </div>
        </Card>

        {/* Result feedback */}
        {result && (
          <FeedbackBanner
            type={result.ok ? "success" : "error"}
            message={result.message}
            dismissible
          />
        )}

        {/* Import PGN */}
        {tab === "import" && (
          <Card header="Import PGN">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-text-secondary block mb-1">
                  Playing as
                </label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={side === "white" ? "primary" : "ghost"}
                    onClick={() => setSide("white")}
                  >
                    White
                  </Button>
                  <Button
                    size="sm"
                    variant={side === "black" ? "primary" : "ghost"}
                    onClick={() => setSide("black")}
                  >
                    Black
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-text-secondary block mb-1">
                  PGN Text
                </label>
                <textarea
                  className="w-full h-40 rounded-lg border border-slate-600 bg-surface-dark px-3 py-2 text-sm text-text-primary placeholder:text-text-muted font-mono focus:border-secondary focus:outline-none resize-y"
                  placeholder='Paste PGN here, e.g.&#10;1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5'
                  value={pgnText}
                  onChange={(e) => setPgnText(e.target.value)}
                />
              </div>
              <Button onClick={handleImport} disabled={!pgnText.trim()}>
                Import
              </Button>
            </div>
          </Card>
        )}

        {/* Export PGN */}
        {tab === "export" && (
          <Card header="Export PGN">
            <div className="space-y-3">
              <p className="text-sm text-text-secondary">
                Click a line below to copy its PGN to the clipboard.
              </p>
              {importedLines.length === 0 ? (
                <p className="text-sm text-text-muted">No imported lines found. Import a PGN first.</p>
              ) : (
                <div className="space-y-2">
                  {importedLines.map((line) => (
                    <Button
                      key={line.id}
                      variant="secondary"
                      size="sm"
                      onClick={() => handleExportLine(line)}
                    >
                      {line.id} ({line.sanMoves.length} moves, {line.source})
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Backup */}
        {tab === "backup" && (
          <div className="space-y-4">
            <Card header="Export Backup">
              <div className="space-y-3">
                <p className="text-sm text-text-secondary">
                  Download all your data (progress, achievements, custom openings) as a JSON file.
                </p>
                <Button onClick={handleBackupExport}>
                  Download Backup
                </Button>
              </div>
            </Card>

            <Card header="Restore Backup">
              <div className="space-y-3">
                <p className="text-sm text-text-secondary">
                  Restore all data from a previously exported backup file.
                  <br />
                  <Badge variant="warning">Warning</Badge>{" "}
                  <span className="text-xs text-text-muted">This will replace all current data.</span>
                </p>
                <label className="inline-flex items-center justify-center font-semibold rounded-lg px-5 py-2.5 text-base gap-2 bg-secondary text-primary-dark hover:bg-secondary-light transition-all duration-150 cursor-pointer">
                  Choose File
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleBackupRestore}
                  />
                </label>
              </div>
            </Card>
          </div>
        )}
      </div>
    </PageShell>
  );
}
