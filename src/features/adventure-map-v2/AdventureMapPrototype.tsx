import { useRef, useState } from "react";
import MapAsset from "./MapAsset.tsx";
import { knightMeadowsAssets } from "./knightMeadowsAssets.ts";
import { buildKnightMeadowsLayout } from "./knightMeadowsLayout.ts";

const CANVAS_W = 1900;
const CANVAS_H = 720;

const scenery = buildKnightMeadowsLayout(knightMeadowsAssets);

export default function AdventureMapPrototype() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0 });
  const [isDragging, setIsDragging] = useState(false);

  function onMouseDown(e: React.MouseEvent) {
    const el = scrollRef.current;
    if (!el) return;
    drag.current = { active: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft };
    setIsDragging(true);
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!drag.current.active || !scrollRef.current) return;
    e.preventDefault();
    scrollRef.current.scrollLeft =
      drag.current.scrollLeft - (e.pageX - scrollRef.current.offsetLeft - drag.current.startX);
  }
  function onMouseUp() { drag.current.active = false; setIsDragging(false); }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0a1220" }}>
      {/* Toolbar */}
      <div style={{
        background: "rgba(0,0,0,0.8)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "8px 20px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        flexShrink: 0,
        zIndex: 100,
        fontFamily: "system-ui, sans-serif",
      }}>
        <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#f1f5f9" }}>
          🏰 Knight Meadows — Asset Prototype
        </span>
        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
          TASK-019A.5 · drag to scroll · all assets via static Vite imports
        </span>
        <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: "#4ade80", fontWeight: 600 }}>
          ← scroll to explore →
        </span>
      </div>

      {/* Scrollable map */}
      <div
        ref={scrollRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{
          flex: 1,
          overflowX: "auto",
          overflowY: "hidden",
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        {/* Canvas */}
        <div style={{
          position: "relative",
          width: CANVAS_W,
          height: CANVAS_H,
          overflow: "hidden",
          userSelect: "none",
        }}>

          {/* ── Sky (CSS gradient — sky is not terrain) ── */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(180deg, #3a78b0 0%, #5a9ece 14%, #87ceeb 34%, #b2dcf0 54%, #cde8c0 70%, #8ec878 84%, #6aaa56 100%)",
            zIndex: 1,
          }} />

          {/* ── Ground base (CSS — base colour under all assets) ── */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: "52%",
            background: "linear-gradient(180deg, #7ec870 0%, #5ea850 35%, #488038 68%, #2e5820 100%)",
            zIndex: 2,
          }} />

          {/* ── Near grass strip — darkest, closest to viewer ── */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 100,
            background: "linear-gradient(180deg, #3a7030 0%, #285020 100%)",
            borderTop: "3px solid #509848",
            zIndex: 3,
          }} />

          {/* ── All PNG assets from layout config ── */}
          {scenery.map((item) => (
            <MapAsset key={item.key} item={item} />
          ))}

          {/* ── Zone flavor labels (world atmosphere, not UI) ── */}
          <ZoneLabel x={120} y={278} text="Training Ground" />
          <ZoneLabel x={400} y={266} text="Knight Meadows" />
          <ZoneLabel x={730} y={310} text="River Crossing" color="rgba(200,235,255,0.50)" />
          <ZoneLabel x={1000} y={272} text="Adventure Wilds" />
          <ZoneLabel x={1440} y={100} text="Knight's Keep" color="rgba(255,228,140,0.60)" />

        </div>
      </div>
    </div>
  );
}

function ZoneLabel({
  x, y, text, color = "rgba(255,255,255,0.36)",
}: {
  x: number; y: number; text: string; color?: string;
}) {
  return (
    <div style={{
      position: "absolute",
      left: x,
      top: y,
      zIndex: 60,
      fontSize: "0.58rem",
      fontWeight: 800,
      letterSpacing: "2px",
      textTransform: "uppercase",
      color,
      textShadow: "0 1px 6px rgba(0,0,0,0.8)",
      pointerEvents: "none",
      fontFamily: "system-ui, sans-serif",
      whiteSpace: "nowrap",
    }}>
      {text}
    </div>
  );
}
