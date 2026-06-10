import { useState, useEffect } from "react";
import { getPieceSkin, getBoardTheme } from "../lib/repositories/rewardsRepo.ts";
import { SELECTED_SKIN_KEY, SELECTED_THEME_KEY } from "./useCollection.ts";
import type { BoardTheme, PieceSkin } from "../types/domain.ts";

function readSelected(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

const CLASSIC_LIGHT = "#f0d9b5";
const CLASSIC_DARK = "#b58863";

/** Maps piece skin IDs to a tint color for customPieces rendering */
const SKIN_TINT_MAP: Record<string, string | undefined> = {
  skin_classic: undefined, // no tint — use default pieces
  skin_blue: "#4299e1",
  skin_gold: "#e6b422",
};

export type BoardCosmetics = {
  /** customDarkSquareStyle for react-chessboard */
  darkSquareStyle: React.CSSProperties;
  /** customLightSquareStyle for react-chessboard */
  lightSquareStyle: React.CSSProperties;
  /** Tint colour for custom pieces, or undefined for default classic */
  pieceTint: string | undefined;
  /** Whether a custom piece skin is active */
  hasCustomPieces: boolean;
};

const FALLBACK: BoardCosmetics = {
  darkSquareStyle: { backgroundColor: CLASSIC_DARK },
  lightSquareStyle: { backgroundColor: CLASSIC_LIGHT },
  pieceTint: undefined,
  hasCustomPieces: false,
};

async function loadTheme(id: string | null): Promise<BoardTheme | undefined> {
  if (!id) return undefined;
  try {
    return await getBoardTheme(id);
  } catch {
    return undefined;
  }
}

async function loadSkin(id: string | null): Promise<PieceSkin | undefined> {
  if (!id) return undefined;
  try {
    return await getPieceSkin(id);
  } catch {
    return undefined;
  }
}

export function useBoardCosmetics(): BoardCosmetics {
  const [cosmetics, setCosmetics] = useState<BoardCosmetics>(FALLBACK);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const themeId = readSelected(SELECTED_THEME_KEY);
      const skinId = readSelected(SELECTED_SKIN_KEY);

      const [theme, skin] = await Promise.all([
        loadTheme(themeId),
        loadSkin(skinId),
      ]);

      if (cancelled) return;

      const tintEntry = skin !== undefined ? SKIN_TINT_MAP[skin.id] : undefined;
      const hasCustomPieces = tintEntry !== undefined;
      const pieceTint = hasCustomPieces ? tintEntry : undefined;

      setCosmetics({
        darkSquareStyle: theme
          ? { backgroundColor: theme.darkSquareColor }
          : { backgroundColor: CLASSIC_DARK },
        lightSquareStyle: theme
          ? { backgroundColor: theme.lightSquareColor }
          : { backgroundColor: CLASSIC_LIGHT },
        pieceTint,
        hasCustomPieces,
      });
    })();

    return () => { cancelled = true; };
  }, []);

  return cosmetics;
}

export { SKIN_TINT_MAP };
