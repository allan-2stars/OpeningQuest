// @vitest-environment jsdom

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ReviewTimeline from "../ReviewTimeline.tsx";
import type { ReviewedMoveViewModel } from "../ReviewTimeline.tsx";
import ReviewDemoPage from "../ReviewDemoPage.tsx";
import { getClassificationLabel, getReasonLabel } from "../reviewLabels.ts";
import type { MoveClassification, ReasonCode } from "../types.ts";

function makeItem(
  moveSan: string,
  classification: MoveClassification = "SMART_MOVE",
  reasonCode: ReasonCode = "OPENING_MOVE",
): ReviewedMoveViewModel {
  return { moveSan, classification, reasonCode };
}

describe("reviewLabels", () => {
  it("maps all classifications to non-empty labels", () => {
    const classifications: MoveClassification[] = [
      "SMART_MOVE", "GOOD_MOVE", "SAFE_MOVE", "WATCH_OUT", "OOPS",
    ];
    for (const c of classifications) {
      const label = getClassificationLabel(c);
      expect(label.icon).toBeTruthy();
      expect(label.label.length).toBeGreaterThan(0);
    }
  });

  it("maps all reason codes to non-empty labels", () => {
    const reasons: ReasonCode[] = [
      "OPENING_MOVE", "BEST_MOVE", "OPENING_EXIT",
      "EVAL_DROP", "LARGE_EVAL_DROP", "SOLID_MOVE", "SAFE_MOVE",
    ];
    for (const r of reasons) {
      const label = getReasonLabel(r);
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it("SMART_MOVE has star icon", () => {
    expect(getClassificationLabel("SMART_MOVE").icon).toBe("⭐");
  });

  it("OOPS has cross icon", () => {
    expect(getClassificationLabel("OOPS").icon).toBe("❌");
  });

  it("OPENING_MOVE reason says 'Opening Path'", () => {
    expect(getReasonLabel("OPENING_MOVE")).toContain("Opening");
  });

  it("LARGE_EVAL_DROP reason avoids centipawn jargon", () => {
    const label = getReasonLabel("LARGE_EVAL_DROP");
    expect(label).not.toContain("cp");
    expect(label).not.toContain("centi");
    expect(label).not.toContain("eval");
  });
});

describe("ReviewTimeline", () => {
  it("shows empty state when no items", () => {
    render(<ReviewTimeline items={[]} />);
    expect(screen.getByText("No review available yet.")).toBeDefined();
    expect(screen.getByText(/Complete a lesson/)).toBeDefined();
  });

  it("shows custom empty messages", () => {
    render(
      <ReviewTimeline
        items={[]}
        emptyMessage="Nothing here"
        emptyDescription="Go practice."
      />,
    );
    expect(screen.getByText("Nothing here")).toBeDefined();
    expect(screen.getByText("Go practice.")).toBeDefined();
  });

  it("renders moves with classification and reason labels", () => {
    const items: ReviewedMoveViewModel[] = [
      makeItem("e4", "SMART_MOVE", "OPENING_MOVE"),
      makeItem("Qh5", "OOPS", "LARGE_EVAL_DROP"),
    ];
    render(<ReviewTimeline items={items} />);

    // Moves should be visible
    expect(screen.getByText("e4")).toBeDefined();
    expect(screen.getByText("Qh5")).toBeDefined();

    // Classification labels should be visible
    expect(screen.getByText(/Smart Move/)).toBeDefined();
    expect(screen.getByText(/Oops/)).toBeDefined();

    // Reason labels should be visible
    expect(screen.getByText(/Opening Path/)).toBeDefined();
    expect(screen.getByText(/Big Position Change/)).toBeDefined();
  });

  it("renders all five classification types", () => {
    const items: ReviewedMoveViewModel[] = [
      makeItem("e4", "SMART_MOVE", "OPENING_MOVE"),
      makeItem("Nf3", "GOOD_MOVE", "SOLID_MOVE"),
      makeItem("O-O", "SAFE_MOVE", "SAFE_MOVE"),
      makeItem("a4", "WATCH_OUT", "OPENING_EXIT"),
      makeItem("Qh5", "OOPS", "LARGE_EVAL_DROP"),
    ];
    render(<ReviewTimeline items={items} />);

    expect(screen.getByText(/Smart Move/)).toBeDefined();
    expect(screen.getByText(/Good Move/)).toBeDefined();
    expect(screen.getByText(/Safe Move/)).toBeDefined();
    expect(screen.getByText(/Watch Out/)).toBeDefined();
    expect(screen.getByText(/Oops/)).toBeDefined();
  });
});

describe("ReviewDemoPage", () => {
  it("renders page title", () => {
    render(
      <MemoryRouter>
        <ReviewDemoPage />
      </MemoryRouter>,
    );
    expect(screen.getByText("Review Demo")).toBeDefined();
  });

  it("renders sample timeline and empty state", () => {
    render(
      <MemoryRouter>
        <ReviewDemoPage />
      </MemoryRouter>,
    );
    // Sample timeline should have moves
    expect(screen.getByText("e4")).toBeDefined();
    expect(screen.getByText("Qh5")).toBeDefined();

    // Empty state should render
    expect(screen.getByText("No review available yet.")).toBeDefined();
  });
});
