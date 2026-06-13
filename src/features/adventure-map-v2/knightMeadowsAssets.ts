// Static Vite imports — each resolves to a content-hashed URL at build time.
// Adding a new asset = add one import + one export entry.

import sirKnightMain    from "../../assets/worlds/knight-meadows/characters/sir-knight-main.png";
import castleMain       from "../../assets/worlds/knight-meadows/structures/castle-main.png";
import trainingCampMain from "../../assets/worlds/knight-meadows/structures/training-camp-main.png";
import watchtowerA      from "../../assets/worlds/knight-meadows/structures/watchtower-a.png";
import signpostMain     from "../../assets/worlds/knight-meadows/structures/signpost-main.png";
import archeryTarget    from "../../assets/worlds/knight-meadows/structures/archery-target.png";
import blueFlagA        from "../../assets/worlds/knight-meadows/structures/blue-flag-a.png";
import woodenBridgeMain from "../../assets/worlds/knight-meadows/terrain/wooden-bridge-main.png";
import riverBankA       from "../../assets/worlds/knight-meadows/terrain/river-bank-a.png";
import riverBankB       from "../../assets/worlds/knight-meadows/terrain/river-bank-b.png";
import riverTileStraight from "../../assets/worlds/knight-meadows/terrain/river-tile-straight.png";
import roadStraight     from "../../assets/worlds/knight-meadows/terrain/road-straight.png";
import treeOakA         from "../../assets/worlds/knight-meadows/environment/tree-oak-a.png";
import treePineA        from "../../assets/worlds/knight-meadows/environment/tree-pine-a.png";
import bushA            from "../../assets/worlds/knight-meadows/environment/bush-a.png";
import bushB            from "../../assets/worlds/knight-meadows/environment/bush-b.png";
import rockA            from "../../assets/worlds/knight-meadows/environment/rock-a.png";
import rockB            from "../../assets/worlds/knight-meadows/environment/rock-b.png";
import rockC            from "../../assets/worlds/knight-meadows/environment/rock-c.png";
import flowerPatchA     from "../../assets/worlds/knight-meadows/environment/flower-patch-a.png";
import flowerPatchB     from "../../assets/worlds/knight-meadows/environment/flower-patch-b.png";
import mushroomPatchA   from "../../assets/worlds/knight-meadows/environment/mushroom-patch-a.png";
import campfireA        from "../../assets/worlds/knight-meadows/effects/campfire-a.png";
import treasureChestA   from "../../assets/worlds/knight-meadows/effects/treasure-chest-a.png";
import cloudA           from "../../assets/worlds/knight-meadows/decorations/cloud-a.png";
import cloudB           from "../../assets/worlds/knight-meadows/decorations/cloud-b.png";
import butterflyA       from "../../assets/worlds/knight-meadows/decorations/butterfly-a.png";

export const knightMeadowsAssets = {
  sirKnightMain,
  castleMain,
  trainingCampMain,
  watchtowerA,
  signpostMain,
  archeryTarget,
  blueFlagA,
  woodenBridgeMain,
  riverBankA,
  riverBankB,
  riverTileStraight,
  roadStraight,
  treeOakA,
  treePineA,
  bushA,
  bushB,
  rockA,
  rockB,
  rockC,
  flowerPatchA,
  flowerPatchB,
  mushroomPatchA,
  campfireA,
  treasureChestA,
  cloudA,
  cloudB,
  butterflyA,
} as const;

export type KnightMeadowsAssets = typeof knightMeadowsAssets;
