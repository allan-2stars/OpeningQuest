import type { KnightMeadowsAssets } from "./knightMeadowsAssets.ts";

export type SceneryItem = {
  key: string;
  src: string;
  x: number;
  y: number;
  w: number;
  z?: number;
  opacity?: number;
  flipX?: boolean;
};

export function buildKnightMeadowsLayout(a: KnightMeadowsAssets): SceneryItem[] {
  // Canvas is 1900 × 720px. Left → Right journey.
  //
  // Zone guide:
  //   x   0–340  START       Sir Knight, signpost, road
  //   x 340–720  MEADOW      Trees, flowers, bushes
  //   x 720–1060 RIVER       river-bank-a, river-bank-b, bridge
  //   x 1060–1380 ADVENTURE  Training camp, campfire, watchtower
  //   x 1380–1900 CASTLE     Castle, treasure chest, flanking trees
  //
  // z-index guide:
  //   1–3   sky/ground CSS (handled in component)
  //   4     far background trees (faded)
  //   5     clouds
  //   6     castle (behind near trees, towers above treeline)
  //   7     mid structures (camp, watchtower)
  //   8     river-bank-b (back bank, behind water)
  //   9     river water tile
  //   10    river-bank-a (near bank, in front of water)
  //   11    bridge (over river)
  //   12    near trees
  //   13    rocks, mushrooms at riverbanks
  //   14    foreground: flowers, bushes (close to viewer)
  //   20    Sir Knight (hero, always on top of scenery)

  return [
    // ── CLOUDS ──────────────────────────────────────────────────────
    { key: "cloud-a-1",  src: a.cloudA, x:  40, y:  22, w: 230, z: 5 },
    { key: "cloud-b-1",  src: a.cloudB, x: 360, y:  10, w: 210, z: 5 },
    { key: "cloud-a-2",  src: a.cloudA, x: 720, y:  30, w: 195, z: 5, opacity: 0.85 },
    { key: "cloud-b-2",  src: a.cloudB, x:1080, y:  14, w: 215, z: 5, opacity: 0.88 },
    { key: "cloud-a-3",  src: a.cloudA, x:1450, y:  26, w: 200, z: 5, opacity: 0.80 },
    { key: "cloud-b-3",  src: a.cloudB, x:1700, y:  12, w: 185, z: 5, opacity: 0.82 },

    // ── FAR BACKGROUND TREES (faded, atmospheric perspective) ────────
    { key: "bg-pine-1",  src: a.treePineA, x: 140, y: 248, w:  82, z: 4, opacity: 0.38 },
    { key: "bg-oak-1",   src: a.treeOakA,  x: 200, y: 236, w:  96, z: 4, opacity: 0.34 },
    { key: "bg-pine-2",  src: a.treePineA, x: 268, y: 250, w:  78, z: 4, opacity: 0.38 },
    { key: "bg-oak-2",   src: a.treeOakA,  x: 448, y: 238, w:  90, z: 4, opacity: 0.33 },
    { key: "bg-pine-3",  src: a.treePineA, x: 516, y: 246, w:  80, z: 4, opacity: 0.36 },
    { key: "bg-pine-4",  src: a.treePineA, x: 920, y: 244, w:  82, z: 4, opacity: 0.36 },
    { key: "bg-oak-3",   src: a.treeOakA,  x: 990, y: 234, w:  94, z: 4, opacity: 0.33 },
    { key: "bg-pine-5",  src: a.treePineA, x:1060, y: 242, w:  80, z: 4, opacity: 0.35 },
    { key: "bg-oak-4",   src: a.treeOakA,  x:1130, y: 236, w:  92, z: 4, opacity: 0.32 },

    // ── CASTLE (dominant right destination) ─────────────────────────
    // Placed early so near trees render in front of it
    { key: "castle",     src: a.castleMain, x: 1390, y: 90, w: 400, z: 6 },

    // ── MID STRUCTURES ──────────────────────────────────────────────
    { key: "camp",       src: a.trainingCampMain, x: 1070, y: 210, w: 260, z: 7 },
    { key: "watchtower", src: a.watchtowerA,      x: 1230, y: 278, w: 120, z: 7 },
    { key: "flag",       src: a.blueFlagA,        x: 1320, y: 324, w:  58, z: 7 },
    { key: "signpost",   src: a.signpostMain,     x:  280, y: 394, w:  62, z: 7 },

    // ── RIVER — back bank, water tile, front bank, bridge ───────────
    // river-bank-b: the far bank (behind the water, higher on canvas)
    { key: "river-bank-b", src: a.riverBankB, x: 400, y: 292, w: 960, z: 8 },
    // river-tile-straight: water fill
    { key: "river-tile",   src: a.riverTileStraight, x: 480, y: 380, w: 800, z: 9 },
    // river-bank-a: the near bank (in front, lower on canvas)
    { key: "river-bank-a", src: a.riverBankA, x: 440, y: 420, w: 880, z: 10 },
    // bridge crossing
    { key: "bridge",       src: a.woodenBridgeMain, x: 700, y: 340, w: 300, z: 11 },

    // ── NEAR TREES ──────────────────────────────────────────────────
    // Left meadow forest
    { key: "oak-1",  src: a.treeOakA,  x: 338, y: 292, w: 158, z: 12 },
    { key: "pine-1", src: a.treePineA, x: 430, y: 306, w: 124, z: 12 },
    { key: "oak-2",  src: a.treeOakA,  x: 494, y: 282, w: 148, z: 12 },
    { key: "pine-2", src: a.treePineA, x: 582, y: 300, w: 120, z: 12 },
    // Right of river
    { key: "oak-3",  src: a.treeOakA,  x: 886, y: 288, w: 152, z: 12 },
    { key: "pine-3", src: a.treePineA, x: 970, y: 302, w: 122, z: 12 },
    { key: "oak-4",  src: a.treeOakA,  x:1036, y: 282, w: 146, z: 12 },
    // Castle flanking trees
    { key: "oak-5",  src: a.treeOakA,  x:1350, y: 376, w: 148, z: 12 },
    { key: "pine-4", src: a.treePineA, x:1694, y: 368, w: 124, z: 12 },
    { key: "oak-6",  src: a.treeOakA,  x:1768, y: 378, w: 144, z: 12 },

    // ── ROCKS at riverbanks ──────────────────────────────────────────
    { key: "rock-a-1", src: a.rockA, x: 448, y: 444, w: 76, z: 13 },
    { key: "rock-b-1", src: a.rockB, x: 530, y: 452, w: 66, z: 13 },
    { key: "rock-c-1", src: a.rockC, x: 620, y: 456, w: 58, z: 13 },
    { key: "rock-a-2", src: a.rockA, x: 900, y: 440, w: 74, z: 13 },
    { key: "rock-b-2", src: a.rockB, x: 980, y: 450, w: 66, z: 13 },
    { key: "mush-1",   src: a.mushroomPatchA, x: 858, y: 462, w: 78, z: 13 },
    { key: "mush-2",   src: a.mushroomPatchA, x: 640, y: 464, w: 72, z: 13 },

    // ── CAMPFIRE + ARCHERY AREA ──────────────────────────────────────
    { key: "campfire",  src: a.campfireA,    x: 1050, y: 406, w: 80, z: 13 },
    { key: "archery",   src: a.archeryTarget, x: 1004, y: 422, w: 70, z: 13 },

    // ── TREASURE CHEST near castle ───────────────────────────────────
    { key: "chest",    src: a.treasureChestA, x: 1644, y: 420, w: 70, z: 13 },

    // ── BUTTERFLY ───────────────────────────────────────────────────
    { key: "butterfly", src: a.butterflyA, x: 336, y: 394, w: 58, z: 14 },

    // ── FOREGROUND — flowers and bushes (close to viewer) ───────────
    { key: "bush-a-1",  src: a.bushA,       x:  42, y: 566, w: 108, z: 14 },
    { key: "flower-a-1",src: a.flowerPatchA,x: 156, y: 578, w:  98, z: 14 },
    { key: "bush-b-1",  src: a.bushB,       x: 264, y: 570, w: 104, z: 14 },
    { key: "flower-b-1",src: a.flowerPatchB,x: 374, y: 580, w:  96, z: 14 },
    { key: "bush-a-2",  src: a.bushA,       x: 480, y: 572, w: 106, z: 14 },
    { key: "flower-a-2",src: a.flowerPatchA,x: 590, y: 578, w:  96, z: 14 },
    { key: "bush-b-2",  src: a.bushB,       x: 886, y: 570, w: 108, z: 14 },
    { key: "flower-b-2",src: a.flowerPatchB,x: 998, y: 578, w:  96, z: 14 },
    { key: "bush-a-3",  src: a.bushA,       x:1112, y: 570, w: 106, z: 14 },
    { key: "flower-a-3",src: a.flowerPatchA,x:1228, y: 578, w:  96, z: 14 },
    { key: "bush-b-3",  src: a.bushB,       x:1344, y: 570, w: 104, z: 14 },
    { key: "flower-b-3",src: a.flowerPatchB,x:1456, y: 578, w:  94, z: 14 },
    { key: "bush-a-4",  src: a.bushA,       x:1566, y: 570, w: 106, z: 14 },
    { key: "flower-a-4",src: a.flowerPatchA,x:1680, y: 578, w:  96, z: 14 },
    { key: "bush-b-4",  src: a.bushB,       x:1790, y: 570, w: 106, z: 14 },

    // ── SIR KNIGHT — hero, always frontmost ─────────────────────────
    { key: "sir-knight", src: a.sirKnightMain, x: 42, y: 348, w: 148, z: 20 },
  ];
}
