// @vitest-environment jsdom

import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CoachPanel from "../CoachPanel.tsx";
import CoachDemoPage from "../CoachDemoPage.tsx";
import { getCoachMessage, getCoachCharacter } from "../coachService.ts";
import type { CoachMessage } from "../types.ts";
import type { MoveClassification, ReasonCode } from "../../reviewAnalysis/types.ts";

function makeMessage(
  classification: MoveClassification = "SMART_MOVE",
  reasonCode?: ReasonCode,
): CoachMessage {
  return getCoachMessage(classification, reasonCode);
}

describe("coachService", () => {
  it("returns SMART_MOVE + OPENING_MOVE template", () => {
    const msg = getCoachMessage("SMART_MOVE", "OPENING_MOVE");
    expect(msg.character).toBe("SIR_KNIGHT");
    expect(msg.title).toBe("Great Job!");
    expect(msg.message).toContain("opening path");
  });

  it("returns SMART_MOVE + BEST_MOVE template", () => {
    const msg = getCoachMessage("SMART_MOVE", "BEST_MOVE");
    expect(msg.title).toBe("Excellent!");
    expect(msg.message).toContain("best move");
  });

  it("returns GOOD_MOVE template", () => {
    const msg = getCoachMessage("GOOD_MOVE");
    expect(msg.title).toBe("Nice Move!");
    expect(msg.message).toContain("solid");
  });

  it("returns SAFE_MOVE template", () => {
    const msg = getCoachMessage("SAFE_MOVE");
    expect(msg.title).toBe("Safe Choice!");
  });

  it("returns WATCH_OUT + OPENING_EXIT template", () => {
    const msg = getCoachMessage("WATCH_OUT", "OPENING_EXIT");
    expect(msg.title).toBe("Watch Out!");
    expect(msg.message).toContain("left the opening path");
  });

  it("returns WATCH_OUT + EVAL_DROP template", () => {
    const msg = getCoachMessage("WATCH_OUT", "EVAL_DROP");
    expect(msg.title).toBe("Careful!");
    expect(msg.message).toContain("harder");
  });

  it("returns OOPS template", () => {
    const msg = getCoachMessage("OOPS");
    expect(msg.title).toBe("Oops!");
    expect(msg.message).toContain("much harder");
  });

  it("returns generic classification template when specific reason not mapped", () => {
    const msg = getCoachMessage("SAFE_MOVE", "EVAL_DROP" as ReasonCode);
    expect(msg.title).toBe("Safe Choice!");
  });
});

describe("getCoachCharacter", () => {
  it("returns Sir Knight metadata", () => {
    const char = getCoachCharacter("SIR_KNIGHT");
    expect(char.name).toBe("Sir Knight");
    expect(char.avatar).toBe("🐴");
  });
});

describe("CoachPanel", () => {
  it("shows empty state when no message", () => {
    render(<CoachPanel message={null} />);
    expect(screen.getByText("Sir Knight")).toBeDefined();
    expect(screen.getByText(/Choose a move/)).toBeDefined();
  });

  it("shows custom empty message", () => {
    render(<CoachPanel message={null} emptyTitle="Select a move" />);
    expect(screen.getByText("Select a move")).toBeDefined();
  });

  it("renders coach message with title and body", () => {
    const msg = makeMessage("GOOD_MOVE");
    render(<CoachPanel message={msg} />);
    expect(screen.getByText("Sir Knight")).toBeDefined();
    expect(screen.getByText("Nice Move!")).toBeDefined();
    expect(screen.getByText(/solid/)).toBeDefined();
  });

  it("renders OOPS message", () => {
    const msg = makeMessage("OOPS");
    render(<CoachPanel message={msg} />);
    expect(screen.getByText("Oops!")).toBeDefined();
    expect(screen.getByText(/much harder/)).toBeDefined();
  });
});

describe("CoachDemoPage", () => {
  it("renders page title", () => {
    render(
      <MemoryRouter>
        <CoachDemoPage />
      </MemoryRouter>,
    );
    expect(screen.getByText("Coach Demo")).toBeDefined();
  });

  it("shows empty coach panel initially", () => {
    render(
      <MemoryRouter>
        <CoachDemoPage />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Choose a move/)).toBeDefined();
  });

  it("updates coach panel when a move is clicked", () => {
    render(
      <MemoryRouter>
        <CoachDemoPage />
      </MemoryRouter>,
    );

    // Click the first move (e4 = SMART_MOVE)
    const e4Buttons = screen.getAllByText("e4");
    fireEvent.click(e4Buttons[0]);

    // Coach panel should update
    expect(screen.getByText("Great Job!")).toBeDefined();
    expect(screen.getByText(/opening path/)).toBeDefined();
  });

  it("updates coach panel to Oops when Qh5 clicked", () => {
    render(
      <MemoryRouter>
        <CoachDemoPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("Qh5"));

    expect(screen.getByText("Oops!")).toBeDefined();
    expect(screen.getByText(/much harder/)).toBeDefined();
  });
});
