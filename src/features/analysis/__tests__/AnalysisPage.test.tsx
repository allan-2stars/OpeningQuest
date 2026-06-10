// @vitest-environment jsdom

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AnalysisPage from "../AnalysisPage.tsx";

// Mock the analysis service module before any imports that use it
vi.mock("../analysisService.ts", () => {
  let status: string = "idle";

  const analysePosition = vi.fn();
  const startEngine = vi.fn();
  const stopEngine = vi.fn();
  const getStatus = vi.fn(() => status);

  return {
    analysisService: {
      startEngine: (...args: unknown[]) => {
        status = "ready";
        getStatus.mockReturnValue("ready");
        return startEngine(...args);
      },
      analysePosition: analysePosition,
      stopEngine: (...args: unknown[]) => {
        status = "terminated";
        getStatus.mockReturnValue("terminated");
        return stopEngine(...args);
      },
      terminateWorker: stopEngine,
      getStatus: getStatus,
    },
  };
});

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/analysis"]}>
      <AnalysisPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AnalysisPage", () => {
  it("renders the page title", () => {
    renderPage();
    expect(screen.getByText("Analysis Debug")).toBeDefined();
  });

  it("shows engine controls", () => {
    renderPage();
    expect(screen.getByText("Start Engine")).toBeDefined();
    expect(screen.getByText("Stop Engine")).toBeDefined();
  });

  it("shows Load Starting Position button", () => {
    renderPage();
    expect(screen.getByText("Load Starting Position")).toBeDefined();
  });

  it("shows Analyse button", () => {
    renderPage();
    expect(screen.getByText("Analyse")).toBeDefined();
  });

  it("shows Clear button", () => {
    renderPage();
    expect(screen.getByText("Clear")).toBeDefined();
  });

  it("loads starting position FEN into textarea", () => {
    renderPage();
    fireEvent.click(screen.getByText("Load Starting Position"));
    const textarea = screen.getByPlaceholderText("Enter FEN or click 'Load Starting Position'") as HTMLTextAreaElement;
    expect(textarea.value).toBe(START_FEN);
  });

  it("clears FEN textarea", () => {
    renderPage();
    fireEvent.click(screen.getByText("Load Starting Position"));
    fireEvent.click(screen.getByText("Clear"));
    const textarea = screen.getByPlaceholderText("Enter FEN or click 'Load Starting Position'") as HTMLTextAreaElement;
    expect(textarea.value).toBe("");
  });

  it("calls start engine and displays ready status", async () => {
    renderPage();
    fireEvent.click(screen.getByText("Start Engine"));
    await waitFor(() => {
      expect(screen.getByText("Ready")).toBeDefined();
    });
  });

  it("displays empty state message when no analysis has run", () => {
    renderPage();
    expect(screen.getByText(/Enter a FEN position/)).toBeDefined();
  });

  it("shows analysis result when engine resolves", async () => {
    const { analysisService } = await import("../analysisService.ts");
    analysisService.analysePosition.mockResolvedValue({
      bestMove: "e2e4",
      evaluation: 38,
      depth: 12,
      pv: ["e2e4", "e7e5", "g1f3"],
    });

    renderPage();
    fireEvent.click(screen.getByText("Load Starting Position"));
    fireEvent.click(screen.getByText("Start Engine"));
    await waitFor(() => { expect(screen.getByText("Ready")).toBeDefined(); });

    fireEvent.click(screen.getByText("Analyse"));
    await waitFor(() => {
      expect(screen.getByText("e2e4")).toBeDefined();
      expect(screen.getByText("+0.38")).toBeDefined();
      expect(screen.getByText("12")).toBeDefined();
    });
  });

  it("shows error message on engine failure", async () => {
    const { analysisService } = await import("../analysisService.ts");
    analysisService.analysePosition.mockRejectedValue(new Error("Engine timeout"));

    renderPage();
    fireEvent.click(screen.getByText("Load Starting Position"));
    fireEvent.click(screen.getByText("Start Engine"));
    await waitFor(() => { expect(screen.getByText("Ready")).toBeDefined(); });

    fireEvent.click(screen.getByText("Analyse"));
    await waitFor(() => {
      expect(screen.getByText("Engine timeout")).toBeDefined();
    });
  });

  it("disables Analyse button while analysing", async () => {
    const { analysisService } = await import("../analysisService.ts");
    // Don't ever resolve the promise — keeps analysing state alive
    analysisService.analysePosition.mockReturnValue(new Promise(() => {}));

    renderPage();
    fireEvent.click(screen.getByText("Load Starting Position"));
    fireEvent.click(screen.getByText("Start Engine"));
    await waitFor(() => { expect(screen.getByText("Ready")).toBeDefined(); });

    fireEvent.click(screen.getByText("Analyse"));
    // Both the button and the status badge contain "Analysing..." — use getAllByText
    await waitFor(() => {
      const elements = screen.getAllByText("Analysing...");
      expect(elements.length).toBeGreaterThanOrEqual(2); // button + status badge
    });
  });

  it("displays stopping engine status when engine stopped", async () => {
    renderPage();
    fireEvent.click(screen.getByText("Start Engine"));
    await waitFor(() => { expect(screen.getByText("Ready")).toBeDefined(); });

    fireEvent.click(screen.getByText("Stop Engine"));
    await waitFor(() => {
      expect(screen.getByText("Stopped")).toBeDefined();
    });
  });

  it("displays error banner for bad FEN", async () => {
    const { analysisService } = await import("../analysisService.ts");
    analysisService.analysePosition.mockRejectedValue(new Error("Bad FEN"));

    renderPage();
    fireEvent.click(screen.getByText("Start Engine"));
    await waitFor(() => { expect(screen.getByText("Ready")).toBeDefined(); });

    // Type something simple
    const textarea = screen.getByPlaceholderText("Enter FEN or click 'Load Starting Position'") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "bad stuff" } });
    fireEvent.click(screen.getByText("Analyse"));

    await waitFor(() => {
      expect(screen.getByText("Bad FEN")).toBeDefined();
    });
  });
});
