// @vitest-environment jsdom

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { db } from "../../../lib/db.ts";
import { seedCoreData } from "../../../lib/seed/seed.ts";
import Practice from "../Practice.tsx";
import "fake-indexeddb/auto";

beforeEach(async () => {
  await db.delete();
  await db.open();
  await seedCoreData();
});

describe("Practice page render", () => {
  it("renders the page title after lesson loads", async () => {
    render(
      <MemoryRouter initialEntries={["/practice/lesson_w1_italian_main"]}>
        <Routes>
          <Route path="/practice/:lessonId" element={<Practice />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(
      () => {
        expect(screen.getByText("Italian Main Line")).toBeDefined();
      },
      { timeout: 8000 },
    );
  });

  it("shows the Flip Board button after loading (chessboard rendered successfully)", async () => {
    render(
      <MemoryRouter initialEntries={["/practice/lesson_w1_italian_main"]}>
        <Routes>
          <Route path="/practice/:lessonId" element={<Practice />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(
      () => {
        // The Flip Board button only renders AFTER the chessboard mounts successfully
        expect(screen.getByText("Flip Board")).toBeDefined();
      },
      { timeout: 10000 },
    );
  }, 15000);

  it("shows the mode selector after loading", async () => {
    render(
      <MemoryRouter initialEntries={["/practice/lesson_w1_italian_main"]}>
        <Routes>
          <Route path="/practice/:lessonId" element={<Practice />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(
      () => {
        expect(screen.getByText("Guided")).toBeDefined();
        expect(screen.getByText("Instinct")).toBeDefined();
      },
      { timeout: 8000 },
    );
  });
});
