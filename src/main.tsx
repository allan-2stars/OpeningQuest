import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app/App.tsx";
import "./index.css";
import { seedCoreData } from "./lib/seed/seed.ts";

async function boot() {
  try {
    await seedCoreData();
  } catch {
    // Seed failure is non-fatal — the app still renders.
    // An empty DB will show empty states rather than crashing.
    console.error("Failed to seed core data — app may show empty states.");
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
}

boot();
