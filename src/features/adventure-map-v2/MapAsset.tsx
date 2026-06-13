import type { SceneryItem } from "./knightMeadowsLayout.ts";

export default function MapAsset({ item }: { item: SceneryItem }) {
  const style: React.CSSProperties = {
    position: "absolute",
    left: item.x,
    top: item.y,
    width: item.w,
    height: "auto",
    zIndex: item.z ?? 10,
    opacity: item.opacity ?? 1,
    display: "block",
    ...(item.flipX ? { transform: "scaleX(-1)" } : {}),
  };

  return (
    <img
      src={item.src}
      alt=""
      aria-hidden="true"
      draggable={false}
      style={style}
    />
  );
}
