import { describe, it, expect } from "vitest";
import { calculateNextReviewDate } from "../reviewSchedule.ts";

describe("calculateNextReviewDate", () => {
  const base = new Date("2026-01-01T00:00:00.000Z");

  it("mastery level 0 → +1 day", () => {
    const result = calculateNextReviewDate(0, base);
    expect(result.getUTCDate()).toBe(2);
    expect(result.getUTCMonth()).toBe(0); // January
  });

  it("mastery level 1 → +3 days", () => {
    const result = calculateNextReviewDate(1, base);
    expect(result.getUTCDate()).toBe(4);
  });

  it("mastery level 2 → +7 days", () => {
    const result = calculateNextReviewDate(2, base);
    expect(result.getUTCDate()).toBe(8);
  });

  it("mastery level 3 → +14 days", () => {
    const result = calculateNextReviewDate(3, base);
    expect(result.getUTCDate()).toBe(15);
  });

  it("mastery level 4 → +30 days", () => {
    const result = calculateNextReviewDate(4, base);
    expect(result.getUTCDate()).toBe(31);
  });

  it("mastery level 5+ → capped at +30 days", () => {
    const r5 = calculateNextReviewDate(5, base);
    const r4 = calculateNextReviewDate(4, base);
    expect(r5.getTime()).toBe(r4.getTime());
  });

  it("negative mastery level → clamped to level 0 (+1 day)", () => {
    const result = calculateNextReviewDate(-1, base);
    expect(result.getUTCDate()).toBe(2);
  });

  it("does not mutate the completedAt argument", () => {
    const input = new Date("2026-06-01T12:00:00.000Z");
    const before = input.getTime();
    calculateNextReviewDate(2, input);
    expect(input.getTime()).toBe(before);
  });
});
