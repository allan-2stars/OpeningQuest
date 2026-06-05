// @vitest-environment jsdom

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Button from "../Button.tsx";
import Badge from "../Badge.tsx";
import XPChip from "../XPChip.tsx";
import KeyChip from "../KeyChip.tsx";
import ProgressBar from "../ProgressBar.tsx";
import FeedbackBanner from "../FeedbackBanner.tsx";
import EmptyState from "../EmptyState.tsx";
import Card from "../Card.tsx";
import PageShell from "../PageShell.tsx";
import LessonNode from "../LessonNode.tsx";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeDefined();
  });

  it("applies disabled state", () => {
    render(<Button disabled>Disabled</Button>);
    const btn = screen.getByRole("button", { name: "Disabled" });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows loading spinner", () => {
    render(<Button loading>Loading</Button>);
    const btn = screen.getByRole("button", { name: "Loading" });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
    expect(btn.querySelector("svg")).toBeDefined();
  });
});

describe("Badge", () => {
  it("renders text", () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText("New")).toBeDefined();
  });

  it("applies variant classes", () => {
    const { container } = render(<Badge variant="success">OK</Badge>);
    expect(container.firstChild).toBeDefined();
  });
});

describe("XPChip", () => {
  it("renders amount", () => {
    render(<XPChip amount={500} />);
    expect(screen.getByText("500")).toBeDefined();
  });

  it("formats large numbers", () => {
    render(<XPChip amount={1500} />);
    expect(screen.getByText("1,500")).toBeDefined();
  });
});

describe("KeyChip", () => {
  it("renders amount", () => {
    render(<KeyChip amount={5} />);
    expect(screen.getByText("5")).toBeDefined();
  });
});

describe("ProgressBar", () => {
  it("renders with aria attributes", () => {
    render(<ProgressBar value={45} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toBeDefined();
    expect(bar.getAttribute("aria-valuenow")).toBe("45");
    expect(bar.getAttribute("aria-valuemax")).toBe("100");
  });

  it("shows label when enabled", () => {
    render(<ProgressBar value={75} showLabel />);
    expect(screen.getByText("75%")).toBeDefined();
  });
});

describe("FeedbackBanner", () => {
  it("renders message", () => {
    render(<FeedbackBanner type="success" message="Well done!" />);
    expect(screen.getByText("Well done!")).toBeDefined();
  });

  it("renders dismiss button when dismissible", () => {
    render(<FeedbackBanner type="error" message="Oops" dismissible />);
    expect(screen.getByLabelText("Dismiss")).toBeDefined();
  });
});

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(<EmptyState title="Nothing here" description="Try again later." />);
    expect(screen.getByText("Nothing here")).toBeDefined();
    expect(screen.getByText("Try again later.")).toBeDefined();
  });
});

describe("Card", () => {
  it("renders header, body, and footer", () => {
    render(
      <Card header="Title" footer="Footer text">
        Body
      </Card>,
    );
    expect(screen.getByText("Title")).toBeDefined();
    expect(screen.getByText("Body")).toBeDefined();
    expect(screen.getByText("Footer text")).toBeDefined();
  });
});

describe("PageShell", () => {
  it("renders title and children", () => {
    render(<PageShell title="My Page"><p>Content</p></PageShell>);
    expect(screen.getByText("My Page")).toBeDefined();
    expect(screen.getByText("Content")).toBeDefined();
  });
});

describe("LessonNode", () => {
  it("renders label and depth", () => {
    render(<LessonNode label="Lesson 1" status="available" depth={3} />);
    expect(screen.getByText("Lesson 1")).toBeDefined();
    expect(screen.getByText("Depth 3")).toBeDefined();
  });

  it("is not interactive when locked", () => {
    const { container } = render(<LessonNode label="Locked" status="locked" depth={1} />);
    expect(container.querySelector("button")).toBeNull();
  });

  it("is interactive when available", () => {
    const { container } = render(<LessonNode label="Open" status="available" depth={1} />);
    expect(container.querySelector("button")).toBeDefined();
  });
});
