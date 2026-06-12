# ADVENTURE_MAP_V2_ASSET_AUDIT.md

Adventure Map V2 — Asset Audit & Architecture Plan

Prepared: 2026-06-12
Status: Planning only — no code changes

---

## 1. Current State

### Existing Adventure implementation

```
src/features/adventure/Adventure.tsx   — page component (≈320 lines)
src/hooks/useAdventureMap.ts           — data hook: world + lesson node loading
src/components/WorldCard.tsx           — world selector card
src/components/LessonNode.tsx          — individual lesson button node
```

The current `Adventure.tsx` is a single file that owns:
- Today's Training card
- Daily Quests card
- World selector grid (WorldCard × N)
- WorldMap sub-component (snaking path, LessonNode × N, boss node)
- DailyQuestCard sub-component

The WorldMap uses a vertical dashed line as the "path", alternating LessonNodes left/right, with emoji status icons. No background images are used. All styling is CSS/Tailwind only.

### Existing assets

27 PNG files under `src/assets/worlds/knight-meadows/` organised by category:

| Category     | Files | Purpose |
|--------------|-------|---------|
| characters   | 1     | Sir Knight protagonist |
| decorations  | 3     | Clouds, butterfly |
| effects      | 2     | Campfire, treasure chest |
| environment  | 9     | Rocks, trees, bushes, flowers, mushrooms |
| structures   | 6     | Castle, training camp, watchtower, signpost, archery target, flag |
| terrain      | 5     | Roads (straight, curve L/R), river tile, wooden bridge |

No other worlds have assets yet. No UI component currently imports any of these files.

---

## 2. Exact Folder Structure

```
src/assets/
└── worlds/
    ├── knight-meadows/           ← World 1 (exists, 27 assets)
    │   ├── characters/
    │   │   └── sir-knight-main.png
    │   ├── decorations/
    │   │   ├── butterfly-a.png
    │   │   ├── cloud-a.png
    │   │   └── cloud-b.png
    │   ├── effects/
    │   │   ├── campfire-a.png
    │   │   └── treasure-chest-a.png
    │   ├── environment/
    │   │   ├── bush-a.png
    │   │   ├── bush-b.png
    │   │   ├── flower-patch-a.png
    │   │   ├── flower-patch-b.png
    │   │   ├── mushroom-patch-a.png
    │   │   ├── rock-a.png
    │   │   ├── rock-b.png
    │   │   ├── rock-c.png
    │   │   ├── tree-oak-a.png
    │   │   └── tree-pine-a.png
    │   ├── structures/
    │   │   ├── archery-target.png
    │   │   ├── blue-flag-a.png
    │   │   ├── castle-main.png
    │   │   ├── signpost-main.png
    │   │   ├── training-camp-main.png
    │   │   └── watchtower-a.png
    │   └── terrain/
    │       ├── river-tile-straight.png
    │       ├── road-curve-left.png
    │       ├── road-curve-right.png
    │       ├── road-straight.png
    │       └── wooden-bridge-main.png
    ├── royal-castle/             ← World 2 (future)
    │   └── [same 6 categories]
    ├── defender-fortress/        ← World 3 (future)
    ├── dragon-mountains/         ← World 4 (future)
    └── grandmaster-academy/      ← World 5 (future)
```

Rules:
- Directory name = world slug (matches `World.id` in the data model)
- Category names are fixed: `characters`, `decorations`, `effects`, `environment`, `structures`, `terrain`
- File names: `<noun>-<variant>.png` where variant is `main` (primary/unique) or `a`/`b`/`c` (multiples)
- All lowercase, hyphen-separated, no spaces
- PNG only — no WebP, no SVG for world assets (keep Vite glob simple)

---

## 3. Asset Naming Convention

Pattern: `<subject>-<qualifier>.png`

| Part | Rule | Examples |
|------|------|---------|
| subject | noun describing the object | `rock`, `tree-oak`, `training-camp` |
| qualifier | `main` for unique/principal; letter suffix for multiples | `main`, `a`, `b`, `c` |

Examples that follow the convention already:
- `sir-knight-main.png` ✓ — unique character, `main` qualifier
- `rock-a.png`, `rock-b.png`, `rock-c.png` ✓ — multiple rock variants
- `road-curve-left.png`, `road-curve-right.png` ✓ — directional qualifier

Examples that would NOT follow:
- `Rock_1.PNG` ✗ — uppercase, underscore, wrong extension
- `rock.png` ✗ — missing qualifier (ambiguous if more rocks added later)

---

## 4. Asset Loading Strategy (Vite)

### Approach: static imports via a per-world barrel

Create `src/assets/worlds/<world-slug>/index.ts` for each world. This file
statically imports every asset for that world and re-exports a typed manifest.

```typescript
// src/assets/worlds/knight-meadows/index.ts
import sirKnightMain from "./characters/sir-knight-main.png";
import cloudA        from "./decorations/cloud-a.png";
import cloudB        from "./decorations/cloud-b.png";
import butterflyA    from "./decorations/butterfly-a.png";
// … all 27 assets …

export const knightMeadowsAssets = {
  characters: { sirKnightMain },
  decorations: { cloudA, cloudB, butterflyA },
  effects:     { campfireA, treasureChestA },
  environment: { bushA, bushB, flowerPatchA, flowerPatchB, mushroomPatchA,
                 rockA, rockB, rockC, treeOakA, treePineA },
  structures:  { archeryTarget, blueFlagA, castleMain, signpostMain,
                 trainingCampMain, watchtowerA },
  terrain:     { riverTileStraight, roadCurveLeft, roadCurveRight,
                 roadStraight, woodenBridgeMain },
} as const;

export type KnightMeadowsAssets = typeof knightMeadowsAssets;
```

Then a single top-level registry maps world IDs to manifests:

```typescript
// src/assets/worlds/index.ts
import { knightMeadowsAssets } from "./knight-meadows/index.ts";

export const worldAssets: Record<string, unknown> = {
  "world-knight-meadows": knightMeadowsAssets,
  // "world-royal-castle": royalCastleAssets,
};
```

**Why static imports, not `import.meta.glob`:**
- Vite static imports are tree-shaken and typed — TypeScript knows each asset URL
- `import.meta.glob` is lazy but returns `Promise<string>` per file — requires async loading logic in components, complicates rendering
- For a PWA that preloads everything via the service worker anyway, eager loading is correct
- The barrel pattern keeps component code clean: `assets.structures.castleMain` not a dynamic path

**Why NOT `public/` folder:**
- `public/` assets bypass Vite hashing — cache busting is manual
- `src/assets/` assets get content-hash filenames automatically — cache safe for PWA updates

---

## 5. Component Structure for Adventure Map V2

The current Adventure.tsx should be decomposed into focused components.

```
src/features/adventure/
├── Adventure.tsx                  ← page root (keep, slim to orchestration only)
├── AdventureMapPanel.tsx          ← new: visual world map canvas with assets
├── WorldSelector.tsx              ← extracted from current Adventure.tsx
├── TodaysTrainingCard.tsx         ← extracted from current Adventure.tsx
├── DailyQuestCard.tsx             ← extracted from current Adventure.tsx (already inline)
├── WorldMapPath.tsx               ← renamed/refactored from current WorldMap inner fn
├── LessonNodeDecoration.tsx       ← new: decorative asset overlay near a node
└── assets/
    └── (do NOT put assets here — use src/assets/worlds/ tree above)
```

### AdventureMapPanel — the new visual canvas

This is the core new component for V2. It renders the path map with actual
background assets instead of the current CSS-only dashed-line approach.

Responsibilities:
- Accepts `mapWorld: MapWorld` and asset manifest as props
- Renders a scrollable canvas-style div (not `<canvas>`) with `position: relative`
- Places terrain tiles (roads, river, bridge) as absolute-positioned `<img>` elements
- Places environment decorations (trees, rocks, bushes) in fixed scenery slots
- Overlays LessonNode components at their path positions
- Scales gracefully: desktop = large canvas, tablet = medium, mobile = condensed

```
AdventureMapPanel
├── WorldBackgroundLayer    — terrain tiles, fills the container
├── SceneryLayer            — environment/decoration assets, purely decorative
├── PathLayer               — draws the node path (SVG curve or CSS)
└── NodesLayer              — LessonNode components at computed positions
```

### Component placement rules

| Component | Asset categories it can use |
|-----------|----------------------------|
| AdventureMapPanel | terrain, environment |
| SceneryLayer | environment, decorations |
| LessonNodeDecoration | effects (campfire = active node, chest = boss) |
| WorldSelector / WorldCard | structures (castle thumbnail for world card) |
| CoachPanel (existing) | characters (sir-knight-main as coach avatar) |

---

## 6. Components That Can Be Reused Without Change

| Component | File | Reuse verdict |
|-----------|------|--------------|
| `LessonNode` | `src/components/LessonNode.tsx` | **Reuse as-is** — status icons and styling are correct |
| `WorldCard` | `src/components/WorldCard.tsx` | **Reuse as-is** — can optionally add structure thumbnail later |
| `ProgressBar` | `src/components/ProgressBar.tsx` | **Reuse as-is** |
| `Card` | `src/components/Card.tsx` | **Reuse as-is** |
| `Button` | `src/components/Button.tsx` | **Reuse as-is** |
| `Badge` | `src/components/Badge.tsx` | **Reuse as-is** |
| `useAdventureMap` | `src/hooks/useAdventureMap.ts` | **Reuse as-is** — data logic is correct and tested |
| `CoachPanel` | `src/features/coach/CoachPanel.tsx` | **Reuse as-is** — can use `sir-knight-main.png` as avatar |

---

## 7. Parts That Must Remain Unchanged

The following features exist inside `Adventure.tsx` today. They must continue to
function identically in V2 — only their visual housing changes.

### Daily Quests

- Data source: `getTodayQuestState`, `claimQuestReward`, `claimAllQuestRewards`
- Current UI: `DailyQuestCard` inline function in Adventure.tsx
- V2 plan: extract to `DailyQuestCard.tsx` with identical logic
- **No changes to quest data layer**

### Today's Training

- Data source: `getDueLessons` → `reviewQueue`
- Current UI: Card with Review Due count, New Lessons count, Est. Time, Start Review button
- V2 plan: extract to `TodaysTrainingCard.tsx` with identical logic
- **No changes to review queue data layer**

### Review Queue

- Lives in `reviewService.ts` + `reviewSessionStore.ts`
- Adventure.tsx calls `startReview(reviewQueue)` and navigates to practice
- **No changes** — V2 adventure page calls the same store action

### Statistics

- Lives at `/statistics` route → `Statistics.tsx`
- Not part of Adventure page — separate route, not touched

### Collection

- Lives at `/collection` route → `Collection.tsx`
- Not part of Adventure page — separate route, not touched

---

## 8. Migration Strategy

### Phase overview

```
V1 Adventure (current)          V2 Adventure (target)
─────────────────────           ───────────────────────────
Adventure.tsx (monolith)   →    Adventure.tsx (thin shell)
  WorldMap (inner fn)      →    AdventureMapPanel.tsx (new)
  DailyQuestCard (inner)   →    DailyQuestCard.tsx (extracted)
  (no assets)              →    knightMeadowsAssets barrel
CSS dashed-line path       →    Terrain tiles + scenery layer
```

### Step-by-step migration

**Step 1 — Create asset barrel (no visual change)**
- Write `src/assets/worlds/knight-meadows/index.ts`
- Write `src/assets/worlds/index.ts` registry
- Verify build passes, no existing tests broken

**Step 2 — Extract DailyQuestCard and TodaysTrainingCard**
- Move the two inline functions out of Adventure.tsx into separate files
- Adventure.tsx imports them — behaviour identical
- Run tests to confirm no regression

**Step 3 — Build AdventureMapPanel alongside existing WorldMap**
- Add `AdventureMapPanel.tsx` using assets
- Route does NOT change — Adventure.tsx still renders current WorldMap
- New component developed and tested in isolation (possibly via `/design-system` dev route)

**Step 4 — Swap WorldMap for AdventureMapPanel**
- Replace the `WorldMap` call in Adventure.tsx with `AdventureMapPanel`
- Remove the old `WorldMap` inner function
- Visual regression test: all node states still visible, boss node still prominent

**Step 5 — Validate and close**
- Lint + tsc + vitest all green
- Manual smoke: navigate to /adventure, click world, click lesson node, check navigation

### What does NOT change during migration

- Routes (`/adventure` stays `/adventure`)
- `useAdventureMap` hook — no changes
- `LessonNode` component — no changes
- All data services (review queue, quests, progression)
- All existing tests

---

## 9. Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Asset PNG sizes bloat PWA bundle | Medium | Audit file sizes before Step 1; compress any >80 KB asset; workbox already globs `**/*.png` |
| Absolute-position layout breaks on small screens | High | Design AdventureMapPanel with a min-width container and `overflow-x: auto`; tablet is primary target |
| `import.meta.glob` temptation over static barrel | Low | Barrel is the approved pattern — document in barrel file header |
| Component decomposition creates prop-drilling depth | Low | Keep asset manifest at AdventureMapPanel level; do not thread it through LessonNode |
| Future worlds need assets before V2 ship | Medium | V2 ships Knight Meadows only; other worlds fall back gracefully with CSS-only styling if no asset barrel exists |
| LessonNode position calculation (for AdventureMapPanel) is complex | High | Derive positions mathematically from node count and index — no hard-coded pixel values; test at 5, 8, 12, 15 nodes |
| Removing WorldMap inner function breaks boss node render | Low | Boss node logic is in `useAdventureMap` data layer, not in WorldMap — safe to rewrite the view |

---

## 10. Decision Points Before Implementation Starts

These require product confirmation before writing any code:

1. **Scrollable vs fixed canvas** — Does the map scroll vertically (like a long path) or fit the viewport? Scrolling is more game-like but harder on tablet.

2. **Static decoration vs procedural placement** — Are environment assets placed at fixed design-time coordinates per world, or generated from a seed/config? Fixed is safer for V1.

3. **Node shape** — Do LessonNodes keep their current rounded-rectangle button shape, or become circular/icon-only nodes on the map?

4. **Terrain tile tiling** — Does `road-straight.png` tile repeating behind the path, or does a single scalable path SVG replace it with asset accents beside it?

5. **Coach avatar** — Should `sir-knight-main.png` replace the emoji coach panel avatar on the Adventure page, or only on the ReviewResultPage?
