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
      // Both skin and theme named "Classic" exist — use getAllByText
      const classicElements = screen.getAllByText("Classic");
      expect(classicElements.length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText("Ocean Blue")).toBeDefined();
    }, { timeout: 15000 });
  }, 20000);

  it("renders board themes from seed data", async () => {
    renderWithRouter(<Collection />);
    await waitFor(() => {
      expect(screen.getByText("Dark Wood")).toBeDefined();
    }, { timeout: 10000 });
  });

  it("shows loading spinner initially", () => {
    renderWithRouter(<Collection />);
    const spinners = document.querySelectorAll(".animate-spin");
    expect(spinners.length).toBeGreaterThanOrEqual(1);
  });

  it("shows 'Active' tag on at least one unlocked skin", async () => {
    renderWithRouter(<Collection />);
    await waitFor(() => {
      const activeTags = screen.getAllByText("Active");
      expect(activeTags.length).toBeGreaterThanOrEqual(1);
    }, { timeout: 10000 });
  });

  it("locked skin has disabled button", async () => {
    renderWithRouter(<Collection />);
    await waitFor(() => {
      expect(screen.getByText("Royal Gold")).toBeDefined();
    }, { timeout: 10000 });

    const goldBtn = screen.getByLabelText("Royal Gold (locked)");
    expect((goldBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it("locked theme has disabled button", async () => {
    renderWithRouter(<Collection />);
    await waitFor(() => {
      expect(screen.getByText("Midnight")).toBeDefined();
    }, { timeout: 10000 });

    const midnightBtn = screen.getByLabelText("Midnight (locked)");
    expect((midnightBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it("can select an unlocked piece skin", async () => {
    renderWithRouter(<Collection />);
    // skin_blue sorts before skin_classic in IndexedDB key order, so Ocean Blue is auto-selected
    await waitFor(() => {
      expect(screen.getByLabelText("Ocean Blue (selected)")).toBeDefined();
    }, { timeout: 10000 });

    // Click Classic skin (currently unselected) to verify skin selection works
    fireEvent.click(screen.getByLabelText("Classic"));

    // Ocean Blue should now be deselected (aria-label changes from "Ocean Blue (selected)" to "Ocean Blue")
    await waitFor(() => {
      expect(screen.getByLabelText("Ocean Blue")).toBeDefined();
    }, { timeout: 5000 });
  }, 20000);

  it("can select an unlocked board theme", async () => {
    renderWithRouter(<Collection />);
    await waitFor(() => {
      expect(screen.getByText("Dark Wood")).toBeDefined();
    }, { timeout: 10000 });

    // Click Dark Wood theme
    fireEvent.click(screen.getByLabelText("Dark Wood"));

    // Verify it shows as selected
    await waitFor(() => {
      expect(screen.getByLabelText("Dark Wood (selected)")).toBeDefined();
    }, { timeout: 5000 });
  });
});
