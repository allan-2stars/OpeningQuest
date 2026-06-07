// @vitest-environment jsdom

import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Collection from "../Collection.tsx";
import { db } from "../../../lib/db.ts";
import { seedCoreData } from "../../../lib/seed/seed.ts";
import "fake-indexeddb/auto";

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

// Provide a full localStorage mock — the jsdom env in Vitest 4.x exposes a stub
// without standard Storage methods (clear/removeItem/etc.), so we inject one.
function makeLocalStorageMock() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
}

beforeEach(async () => {
  vi.stubGlobal("localStorage", makeLocalStorageMock());

  await db.delete();
  await db.open();
  await seedCoreData();
});

describe("Collection page", () => {
  it("renders piece skins from seed data", async () => {
    renderWithRouter(<Collection />);
    await waitFor(() => {
      const elements = screen.getAllByText("Classic");
      expect(elements.length).toBeGreaterThanOrEqual(2); // skin + theme both named Classic
    });
  });

  it("renders board themes from seed data", async () => {
    renderWithRouter(<Collection />);
    await waitFor(() => {
      const themes = screen.getAllByText("Classic");
      expect(themes.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows loading spinner initially", () => {
    renderWithRouter(<Collection />);
    // The loading animation should be present before data loads
    const spinners = document.querySelectorAll(".animate-spin");
    expect(spinners.length).toBeGreaterThanOrEqual(1);
  });

  it("shows 'Active' tag on the default unlocked skin", async () => {
    renderWithRouter(<Collection />);
    await waitFor(() => {
      const activeTags = screen.getAllByText("Active");
      expect(activeTags.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("can select a different unlocked skin", async () => {
    // Add a second unlocked skin
    await db.pieceSkins.add({
      id: "skin_golden",
      name: "Golden",
      description: "Shiny gold pieces",
      pieceType: "all",
      unlocked: true,
      previewUrl: "/skins/golden.svg",
    });

    renderWithRouter(<Collection />);

    await waitFor(() => {
      expect(screen.getByText("Golden")).toBeDefined();
    });

    // Click the Golden skin
    const goldenBtn = screen.getByLabelText("Golden");
    fireEvent.click(goldenBtn);

    // After click, it should show Active on Golden
    await waitFor(() => {
      const goldenCard = screen.getByLabelText("Golden (selected)");
      expect(goldenCard).toBeDefined();
    });
  });

  it("locked skin has disabled button", async () => {
    // Add a locked skin
    await db.pieceSkins.add({
      id: "skin_dragon",
      name: "Dragon",
      description: "Fiery dragon pieces",
      pieceType: "knight",
      unlocked: false,
      previewUrl: "/skins/dragon.svg",
    });

    renderWithRouter(<Collection />);

    await waitFor(() => {
      expect(screen.getByText("Dragon")).toBeDefined();
    });

    const dragonBtn = screen.getByLabelText("Dragon (locked)");
    expect((dragonBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it("locked theme has disabled button", async () => {
    await db.boardThemes.add({
      id: "theme_forest",
      name: "Forest",
      description: "Woodland colours",
      unlocked: false,
      previewUrl: "/themes/forest.svg",
      lightSquareColor: "#a8d5a2",
      darkSquareColor: "#2d5a27",
    });

    renderWithRouter(<Collection />);

    await waitFor(() => {
      expect(screen.getByText("Forest")).toBeDefined();
    });

    const forestBtn = screen.getByLabelText("Forest (locked)");
    expect((forestBtn as HTMLButtonElement).disabled).toBe(true);
  });
});
