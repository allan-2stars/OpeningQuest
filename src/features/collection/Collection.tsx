import PageShell from "../../components/PageShell.tsx";
import EmptyState from "../../components/EmptyState.tsx";
import FeedbackBanner from "../../components/FeedbackBanner.tsx";
import { useCollection } from "../../hooks/useCollection.ts";
import type { PieceSkin, BoardTheme } from "../../types/domain.ts";

export default function Collection() {
  const {
    skins,
    themes,
    selectedSkinId,
    selectedThemeId,
    isLoading,
    error,
    selectSkin,
    selectTheme,
  } = useCollection();

  if (isLoading) {
    return (
      <PageShell title="Collection">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-secondary border-t-transparent" />
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Collection">
        <FeedbackBanner type="error" message={error} />
      </PageShell>
    );
  }

  return (
    <PageShell title="Collection">
      <div className="flex flex-col gap-8 max-w-4xl">
        {/* Piece Skins */}
        <section>
          <h3 className="text-xl font-bold text-text-primary mb-4">Piece Skins</h3>
          {skins.length === 0 ? (
            <EmptyState icon="♞" title="No piece skins yet" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {skins.map((skin) => (
                <CosmeticCard
                  key={skin.id}
                  item={skin}
                  isSelected={skin.id === selectedSkinId}
                  onSelect={() => selectSkin(skin.id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Board Themes */}
        <section>
          <h3 className="text-xl font-bold text-text-primary mb-4">Board Themes</h3>
          {themes.length === 0 ? (
            <EmptyState icon="🎨" title="No board themes yet" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {themes.map((theme) => (
                <BoardThemeCard
                  key={theme.id}
                  theme={theme}
                  isSelected={theme.id === selectedThemeId}
                  onSelect={() => selectTheme(theme.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}

function CosmeticCard({
  item,
  isSelected,
  onSelect,
}: {
  item: PieceSkin;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const canSelect = item.unlocked && !isSelected;

  return (
    <button
      onClick={canSelect ? onSelect : undefined}
      disabled={!canSelect}
      className={`rounded-xl border-2 p-4 text-center transition-all duration-150
        ${item.unlocked
          ? "border-slate-600 bg-surface hover:border-secondary cursor-pointer active:scale-95"
          : "border-slate-700 bg-slate-900/50 opacity-50 cursor-not-allowed"
        }
        ${isSelected ? "border-secondary bg-primary/20 ring-2 ring-secondary/30" : ""}
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50
      `}
      aria-label={`${item.name}${item.unlocked ? (isSelected ? " (selected)" : "") : " (locked)"}`}
    >
      <div className="text-3xl mb-2" aria-hidden="true">
        {item.unlocked ? "♞" : "🔒"}
      </div>
      <p className="text-sm font-semibold text-text-primary truncate">{item.name}</p>
      <p className="text-xs text-text-muted mt-0.5">{item.pieceType}</p>
      {isSelected && (
        <span className="inline-block mt-2 text-xs font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
          Active
        </span>
      )}
      {!item.unlocked && (
        <span className="inline-block mt-2 text-xs text-text-muted bg-slate-800 px-2 py-0.5 rounded-full">
          Locked
        </span>
      )}
    </button>
  );
}

function BoardThemeCard({
  theme,
  isSelected,
  onSelect,
}: {
  theme: BoardTheme;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const canSelect = theme.unlocked && !isSelected;

  return (
    <button
      onClick={canSelect ? onSelect : undefined}
      disabled={!canSelect}
      className={`rounded-xl border-2 p-4 text-center transition-all duration-150
        ${theme.unlocked
          ? "border-slate-600 bg-surface hover:border-secondary cursor-pointer active:scale-95"
          : "border-slate-700 bg-slate-900/50 opacity-50 cursor-not-allowed"
        }
        ${isSelected ? "border-secondary bg-primary/20 ring-2 ring-secondary/30" : ""}
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50
      `}
      aria-label={`${theme.name}${theme.unlocked ? (isSelected ? " (selected)" : "") : " (locked)"}`}
    >
      <div className="flex gap-1 justify-center mb-2" aria-hidden="true">
        <span
          className="inline-block h-6 w-6 rounded border border-slate-500"
          style={{ backgroundColor: theme.lightSquareColor }}
        />
        <span
          className="inline-block h-6 w-6 rounded border border-slate-500"
          style={{ backgroundColor: theme.darkSquareColor }}
        />
      </div>
      <p className="text-sm font-semibold text-text-primary truncate">{theme.name}</p>
      <p className="text-xs text-text-muted mt-0.5">{theme.description}</p>
      {isSelected && (
        <span className="inline-block mt-2 text-xs font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
          Active
        </span>
      )}
      {!theme.unlocked && (
        <span className="inline-block mt-2 text-xs text-text-muted bg-slate-800 px-2 py-0.5 rounded-full">
          Locked
        </span>
      )}
    </button>
  );
}
