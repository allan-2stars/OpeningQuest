// @vitest-environment jsdom

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { db } from "../../../lib/db.ts";
import { seedCoreData } from "../../../lib/seed/seed.ts";
import ReviewResultPage from "../ReviewResultPage.tsx";
import { buildReviewResult } from "../reviewBuilderService.ts";
import { saveReviewResult, getReviewResult } from "../reviewResultsRepo.ts";
import type { TrainingSessionResult } from "../../../features/training/types.ts";
import type { OpeningLineStatus } from "../../../features/openings/types.ts";
import "fake-indexeddb/auto";

function makeSessionResult(overrides?: Partial<TrainingSessionResult>): TrainingSessionResult {
  return {
    lessonId: "lesson_test",
    mode: "guided",
    completed: true,
    mistakes: 0,
    totalMoves: 7,
    totalUserMoves: 4,
    perfectRun: true,
    history: [
      { type: "accepted", legal: true, correct: true, san: "e4", message: "Correct!" },
      { type: "opponent", legal: true, correct: true, san: "e5", message: "Opponent played e5" },
      { type: "accepted", legal: true, correct: true, san: "Nf3", message: "Correct!" },
      { type: "opponent", legal: true, correct: true, san: "Nc6", message: "Opponent played Nc6" },
      { type: "accepted", legal: true, correct: true, san: "Bc4", message: "Correct!" },
      { type: "opponent", legal: true, correct: true, san: "Bc5", message: "Opponent played Bc5" },
      { type: "accepted", legal: true, correct: true, san: "c3", message: "Correct!" },
    ],
    ...overrides,
  };
}

const IN_LINE_STATUS: OpeningLineStatus = {
  openingId: "lesson_test",
  totalPly: 7,
  inLine: true,
  exited: false,
};

const EXIT_STATUS: OpeningLineStatus = {
  openingId: "lesson_test",
  totalPly: 7,
  inLine: false,
  exited: true,
  exitPly: 5,
  exitMoveSan: "a4",
  expectedMoveSan: "Bc4",
};

describe("buildReviewResult", () => {
  it("builds a review from a completed session", () => {
    const result = makeSessionResult();
    const review = buildReviewResult(result, "2026-06-11T00:00:00.000Z", IN_LINE_STATUS);
    expect(review.lessonId).toBe("lesson_test");
    expect(review.moves.length).toBeGreaterThan(0);
    expect(review.summary).toHaveProperty("smartMoves");
    expect(review.summary).toHaveProperty("goodMoves");
    expect(review.summary).toHaveProperty("safeMoves");
    expect(review.summary).toHaveProperty("watchOuts");
    expect(review.summary).toHaveProperty("oopses");
  });

  it("correct moves in opening line get SMART_MOVE", () => {
    const result = makeSessionResult();
    const review = buildReviewResult(result, "2026-06-11T00:00:00.000Z", IN_LINE_STATUS);
    const classifications = review.moves.map((m) => m.classification);
    expect(classifications.every((c) => c === "SMART_MOVE")).toBe(true);
  });

  it("opening exit move gets WATCH_OUT", () => {
    const result = makeSessionResult({
      history: [
        { type: "accepted", legal: true, correct: true, san: "e4", message: "Correct!" },
        { type: "opponent", legal: true, correct: true, san: "e5", message: "Opponent" },
        { type: "accepted", legal: false, correct: false, san: "a4", message: "Wrong" },
      ],
      completed: false,
      perfectRun: false,
    });
    const exitStatus: OpeningLineStatus = {
      openingId: "lesson_test",
      totalPly: 7,
      inLine: false,
      exited: true,
      exitPly: 3,
      exitMoveSan: "a4",
      expectedMoveSan: "Nf3",
    };
    const review = buildReviewResult(result, "2026-06-11T00:00:00.000Z", exitStatus);
    expect(review.summary.watchOuts).toBe(1);
  });

  it("summary counts add up", () => {
    const result = makeSessionResult();
    const review = buildReviewResult(result, "2026-06-11T00:00:00.000Z", IN_LINE_STATUS);
    const total = review.summary.smartMoves + review.summary.goodMoves +
      review.summary.safeMoves + review.summary.watchOuts + review.summary.oopses;
    expect(total).toBe(review.moves.length);
  });
});

beforeEach(async () => {
  await db.delete();
  await db.open();
  await seedCoreData();
  localStorage.clear();
});

describe("reviewResultsRepo", () => {
  it("saves and retrieves a review result", async () => {
    const result = makeSessionResult();
    const review = buildReviewResult(result, "2026-06-11T00:00:00.000Z", IN_LINE_STATUS);
    await saveReviewResult(review);

    const loaded = await getReviewResult("lesson_test");
    expect(loaded).not.toBeNull();
    expect(loaded!.lessonId).toBe("lesson_test");
    expect(loaded!.moves.length).toBe(review.moves.length);
  });

  it("returns null for non-existent review", async () => {
    const loaded = await getReviewResult("nonexistent");
    expect(loaded).toBeNull();
  });

  it("persists summary counts", async () => {
    const result = makeSessionResult();
    const review = buildReviewResult(result, "2026-06-11T00:00:00.000Z", IN_LINE_STATUS);
    await saveReviewResult(review);

    const loaded = await getReviewResult("lesson_test");
    expect(loaded!.summary.smartMoves).toBe(review.summary.smartMoves);
  });
});

describe("ReviewResultPage", () => {
  it("shows empty state when no review found", async () => {
    render(
      <MemoryRouter initialEntries={["/review-result/unknown"]}>
        <Routes>
          <Route path="/review-result/:lessonId" element={<ReviewResultPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/No review available/)).toBeDefined();
    }, { timeout: 5000 });
  });

  it("shows review summary and moves after save then load", async () => {
    const result = makeSessionResult();
    const review = buildReviewResult(result, "2026-06-11T00:00:00.000Z", IN_LINE_STATUS);
    await saveReviewResult(review);

    render(
      <MemoryRouter initialEntries={["/review-result/lesson_test"]}>
        <Routes>
          <Route path="/review-result/:lessonId" element={<ReviewResultPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Session Review")).toBeDefined();
    }, { timeout: 5000 });

    // Summary counts should show
    expect(screen.getByText("e4")).toBeDefined();
  });
});
