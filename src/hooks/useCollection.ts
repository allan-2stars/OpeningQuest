import { useState, useEffect, useCallback } from "react";
import { getAllPieceSkins, getAllBoardThemes } from "../lib/repositories/rewardsRepo.ts";
import type { PieceSkin, BoardTheme } from "../types/domain.ts";

const SELECTED_SKIN_KEY = "oq_selected_skin_id";
const SELECTED_THEME_KEY = "oq_selected_theme_id";

function readSelected(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSelected(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage may be unavailable in incognito or disk-full scenarios
  }
}

export type CollectionState = {
  skins: PieceSkin[];
  themes: BoardTheme[];
  selectedSkinId: string | null;
  selectedThemeId: string | null;
  isLoading: boolean;
  error: string | null;
  selectSkin: (id: string) => void;
  selectTheme: (id: string) => void;
};

export function useCollection(): CollectionState {
  const [skins, setSkins] = useState<PieceSkin[]>([]);
  const [themes, setThemes] = useState<BoardTheme[]>([]);
  const [selectedSkinId, setSelectedSkinId] = useState<string | null>(() => readSelected(SELECTED_SKIN_KEY));
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(() => readSelected(SELECTED_THEME_KEY));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [loadedSkins, loadedThemes] = await Promise.all([
          getAllPieceSkins(),
          getAllBoardThemes(),
        ]);
        if (cancelled) return;
        setSkins(loadedSkins);
        setThemes(loadedThemes);

        // Default-select the first unlocked skin/theme if none persisted yet
        if (!readSelected(SELECTED_SKIN_KEY)) {
          const first = loadedSkins.find((s) => s.unlocked);
          if (first) {
            setSelectedSkinId(first.id);
            writeSelected(SELECTED_SKIN_KEY, first.id);
          }
        }
        if (!readSelected(SELECTED_THEME_KEY)) {
          const first = loadedThemes.find((t) => t.unlocked);
          if (first) {
            setSelectedThemeId(first.id);
            writeSelected(SELECTED_THEME_KEY, first.id);
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load collection");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const selectSkin = useCallback((id: string) => {
    const skin = skins.find((s) => s.id === id);
    if (!skin || !skin.unlocked) return;
    setSelectedSkinId(id);
    writeSelected(SELECTED_SKIN_KEY, id);
  }, [skins]);

  const selectTheme = useCallback((id: string) => {
    const theme = themes.find((t) => t.id === id);
    if (!theme || !theme.unlocked) return;
    setSelectedThemeId(id);
    writeSelected(SELECTED_THEME_KEY, id);
  }, [themes]);

  return { skins, themes, selectedSkinId, selectedThemeId, isLoading, error, selectSkin, selectTheme };
}
