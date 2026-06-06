import { useState, useEffect, useCallback } from "react";
import { getAllWorlds, getLessonsByWorld } from "../lib/repositories/curriculumRepo.ts";
import { getAllLessonProgress } from "../lib/repositories/lessonProgressRepo.ts";
import type { World, Lesson, LessonProgress, LessonStatus } from "../types/domain.ts";

export type MapLessonNode = {
  id: string;
  title: string;
  depth: number;
  status: LessonStatus;
  isBoss: boolean;
};

export type MapWorld = {
  world: World;
  nodes: MapLessonNode[];
  bossNode: MapLessonNode | null;
  masteredCount: number;
  totalCount: number;
  unlocked: boolean;
};

type AdventureMapState = {
  worlds: MapWorld[];
  selectedWorldId: string | null;
  selectWorld: (id: string) => void;
  isLoading: boolean;
  error: string | null;
};

function deriveNodeStatus(lesson: Lesson, progressMap: Map<string, LessonProgress>): LessonStatus {
  const prog = progressMap.get(lesson.id);
  if (prog) return prog.status;
  return "locked";
}

/**
 * Second-pass progressive unlock: within an unlocked world, mark the first
 * non-complete lesson as "available" if the immediately preceding lesson
 * (or the start-of-world condition) is complete.
 */
function applyProgressiveUnlock(
  nodes: MapLessonNode[],
  bossNode: MapLessonNode | null,
  progressMap: Map<string, LessonProgress>,
): void {
  // Determine the index of the first non-complete node
  const allNodes = [...nodes];
  if (bossNode) allNodes.push(bossNode);

  let firstAvailableSet = false;
  for (let i = 0; i < allNodes.length; i++) {
    const node = allNodes[i];
    const prog = progressMap.get(node.id);

    // If this node already has explicit stored progress, skip — it's already known
    if (prog && prog.status !== "locked") continue;

    // If we haven't yet set an available and this node is still locked
    if (!firstAvailableSet && node.status === "locked") {
      // Check if the previous node is mastered/review_due (or i==0, start of world)
      const prev = i > 0 ? allNodes[i - 1] : null;
      const prevProg = prev ? progressMap.get(prev.id) : null;
      const prevComplete = !prev || (prevProg && (prevProg.status === "mastered" || prevProg.status === "review_due"));

      if (prevComplete) {
        node.status = "available";
        firstAvailableSet = true;
        // Propagate status to the original node objects
        if (i < nodes.length) {
          nodes[i] = { ...nodes[i], status: "available" };
        } else if (bossNode) {
          Object.assign(bossNode, { status: "available" as LessonStatus });
        }
      }
    }
  }
}

export function useAdventureMap(): AdventureMapState {
  const [worlds, setWorlds] = useState<MapWorld[]>([]);
  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [rawWorlds, allProgress] = await Promise.all([
          getAllWorlds(),
          getAllLessonProgress(),
        ]);
        if (cancelled) return;

        const progressMap = new Map(allProgress.map((p) => [p.lessonId, p]));

        const mapWorlds: MapWorld[] = [];

        // Build worlds in order. World 0 is always unlocked; subsequent worlds
        // unlock when all lessons in the previous world are mastered.
        let prevWorldComplete = true;

        for (let i = 0; i < rawWorlds.length; i++) {
          const w = rawWorlds[i];
          const worldUnlocked = prevWorldComplete;
          const lessons = await getLessonsByWorld(w.id);
          if (cancelled) return;

          // Separate boss from regular lessons
          const regularLessons = lessons.filter((l) => l.id !== w.bossBattleId);
          const bossLesson = lessons.find((l) => l.id === w.bossBattleId) ?? null;

          const nodes: MapLessonNode[] = regularLessons.map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            depth: lesson.depth,
            status: deriveNodeStatus(lesson, progressMap),
            isBoss: false,
          }));

          const bossNode: MapLessonNode | null = bossLesson
            ? {
                id: bossLesson.id,
                title: bossLesson.title,
                depth: bossLesson.depth,
                status: deriveNodeStatus(bossLesson, progressMap),
                isBoss: true,
              }
            : null;

          // Within-world progressive unlock — only runs if world is unlocked
          if (worldUnlocked) {
            applyProgressiveUnlock(nodes, bossNode, progressMap);
          }

          const masteredCount = [...nodes, bossNode].filter(
            (n) => n && (n.status === "mastered" || n.status === "review_due"),
          ).length;
          const totalCount = nodes.length + (bossNode ? 1 : 0);

          // Check if this world is fully complete (for unlocking next)
          if (worldUnlocked) {
            const allMastered = [...nodes, bossNode].every(
              (n) => n && (n.status === "mastered" || n.status === "review_due"),
            );
            prevWorldComplete = allMastered && totalCount > 0;
          }

          mapWorlds.push({
            world: w,
            nodes,
            bossNode,
            masteredCount,
            totalCount,
            unlocked: worldUnlocked,
          });
        }

        if (cancelled) return;

        setWorlds(mapWorlds);
        if (mapWorlds.length > 0) {
          setSelectedWorldId((prev) => prev ?? mapWorlds[0].world.id);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load adventure map");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const selectWorld = useCallback((id: string) => {
    setSelectedWorldId(id);
  }, []);

  return { worlds, selectedWorldId, selectWorld, isLoading, error };
}
