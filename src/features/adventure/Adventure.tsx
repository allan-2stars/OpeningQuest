import { useNavigate } from "react-router-dom";
import PageShell from "../../components/PageShell.tsx";
import WorldCard from "../../components/WorldCard.tsx";
import LessonNode from "../../components/LessonNode.tsx";
import FeedbackBanner from "../../components/FeedbackBanner.tsx";
import EmptyState from "../../components/EmptyState.tsx";
import { useAdventureMap } from "../../hooks/useAdventureMap.ts";
import type { MapWorld } from "../../hooks/useAdventureMap.ts";

export default function Adventure() {
  const navigate = useNavigate();
  const { worlds, selectedWorldId, selectWorld, isLoading, error } = useAdventureMap();

  const selectedWorld = worlds.find((w) => w.world.id === selectedWorldId) ?? null;

  if (isLoading) {
    return (
      <PageShell title="Adventure">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-secondary border-t-transparent" />
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Adventure">
        <FeedbackBanner type="error" message={error} />
      </PageShell>
    );
  }

  if (worlds.length === 0) {
    return (
      <PageShell title="Adventure">
        <EmptyState
          icon="🗺"
          title="No worlds available"
          description="The adventure map is still being prepared. Check back soon!"
        />
      </PageShell>
    );
  }

  return (
    <PageShell title="Adventure">
      {/* World selector */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {worlds.map((mw) => (
          <WorldCard
            key={mw.world.id}
            name={mw.world.name}
            description={mw.world.description}
            theme={mw.world.theme}
            progress={mw.masteredCount}
            totalLessons={mw.totalCount}
            masteredLessons={mw.masteredCount}
            unlocked={mw.unlocked}
            current={mw.world.id === selectedWorldId}
            onClick={() => selectWorld(mw.world.id)}
          />
        ))}
      </div>

      {/* Selected world map */}
      {selectedWorld && (
        <WorldMap
          mapWorld={selectedWorld}
          onNodeClick={(lessonId) => navigate(`/practice/${lessonId}`)}
        />
      )}
    </PageShell>
  );
}

function WorldMap({
  mapWorld,
  onNodeClick,
}: {
  mapWorld: MapWorld;
  onNodeClick: (lessonId: string) => void;
}) {
  const { world, nodes, bossNode, unlocked } = mapWorld;

  return (
    <div className="rounded-2xl border border-slate-700 bg-surface-dark p-6 sm:p-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary">{world.name}</h2>
          <p className="text-sm text-text-secondary">{world.description}</p>
        </div>
        {!unlocked && (
          <span className="text-sm font-semibold text-text-muted bg-slate-800 px-3 py-1 rounded-full">
            Locked
          </span>
        )}
      </div>

      {/* Lesson nodes in a snaking path */}
      <div className="relative mt-6">
        {/* Connecting path — vertical dashed line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-slate-700 hidden sm:block" />

        <div className="flex flex-col gap-6 relative">
          {nodes.map((node, idx) => {
            const isLeft = idx % 2 === 0;
            return (
              <div
                key={node.id}
                className={`flex items-center gap-4 ${isLeft ? "sm:flex-row" : "sm:flex-row-reverse"}`}
              >
                {/* Node column */}
                <div className={`flex-1 flex ${isLeft ? "sm:justify-end" : "sm:justify-start"} justify-center`}>
                  <LessonNode
                    label={node.title}
                    status={node.status}
                    depth={node.depth}
                    onClick={node.status !== "locked" ? () => onNodeClick(node.id) : undefined}
                  />
                </div>
                {/* Spacer for the path on the other side */}
                <div className="hidden sm:block flex-1" />
              </div>
            );
          })}

          {/* Boss node */}
          {bossNode && (
            <div className="flex items-center gap-4">
              <div className="flex-1 hidden sm:block" />
              <div className="flex-1 flex justify-center sm:justify-start">
                <div className="relative">
                  {/* Crown indicator */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg" aria-hidden="true">
                    👑
                  </div>
                  <LessonNode
                    label={bossNode.title}
                    status={bossNode.status}
                    depth={bossNode.depth}
                    isBoss
                    onClick={bossNode.status !== "locked" ? () => onNodeClick(bossNode.id) : undefined}
                  />
                </div>
              </div>
              <div className="hidden sm:block flex-1" />
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 flex flex-wrap gap-3 justify-center text-xs text-text-muted">
        <span className="flex items-center gap-1">🔒 Locked</span>
        <span className="flex items-center gap-1">📖 Available</span>
        <span className="flex items-center gap-1">📘 Learning</span>
        <span className="flex items-center gap-1">⭐ Mastered</span>
        <span className="flex items-center gap-1">⏳ Review Due</span>
        <span className="flex items-center gap-1">👑 Boss</span>
      </div>
    </div>
  );
}
