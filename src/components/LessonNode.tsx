import type { LessonStatus } from "../types/domain.ts";

type LessonNodeProps = {
  label: string;
  status: LessonStatus;
  depth: number;
  isBoss?: boolean;
  onClick?: () => void;
  className?: string;
};

const statusConfig: Record<LessonStatus, { bg: string; border: string; ring: string; text: string; icon: string }> = {
  locked:     { bg: "bg-slate-800", border: "border-slate-600", ring: "ring-slate-600/30", text: "text-slate-500", icon: "🔒" },
  available:  { bg: "bg-primary", border: "border-secondary", ring: "ring-secondary/40", text: "text-white", icon: "📖" },
  learning:   { bg: "bg-primary-light", border: "border-warning", ring: "ring-warning/40", text: "text-white", icon: "📘" },
  mastered:   { bg: "bg-success/30", border: "border-success", ring: "ring-success/30", text: "text-white", icon: "⭐" },
  review_due: { bg: "bg-warning/20", border: "border-warning", ring: "ring-warning/40", text: "text-white", icon: "⏳" },
};

export default function LessonNode({
  label,
  status,
  depth,
  isBoss = false,
  onClick,
  className = "",
}: LessonNodeProps) {
  const { bg, border, ring, text, icon } = statusConfig[status];
  const isInteractive = status !== "locked";

  return (
    <button
      onClick={isInteractive ? onClick : undefined}
      disabled={!isInteractive}
      className={`flex flex-col items-center gap-1 select-none
        ${bg} ${border} ${text}
        rounded-2xl border-2 px-4 py-3
        ${isInteractive ? "cursor-pointer hover:ring-4 active:scale-95 transition-all duration-150" : "opacity-60 cursor-not-allowed"}
        ${isInteractive ? `focus-visible:outline-none focus-visible:ring-4 ${ring}` : ""}
        ${isBoss ? "scale-125" : ""}
        ${className}`}
      aria-label={`${label} — ${status.replace("_", " ")}${isBoss ? " (Boss)" : ""}`}
    >
      {icon && <span className="text-lg leading-none" aria-hidden="true">{icon}</span>}
      <span className={`font-bold ${isBoss ? "text-base" : "text-sm"}`}>{label}</span>
      <span className="text-[10px] uppercase tracking-wider opacity-60">Depth {depth}</span>
    </button>
  );
}
