import ProgressBar from "./ProgressBar.tsx";

type WorldCardProps = {
  name: string;
  description: string;
  theme: string;
  progress: number;
  totalLessons: number;
  masteredLessons: number;
  unlocked: boolean;
  current?: boolean;
  onClick?: () => void;
  className?: string;
};

const themeBorderColors: Record<string, string> = {
  grassland: "border-emerald-700",
  castle: "border-amber-600",
  fortress: "border-slate-500",
  mountains: "border-red-700",
  academy: "border-indigo-600",
};

const themeBgColors: Record<string, string> = {
  grassland: "from-emerald-950/60 to-surface",
  castle: "from-amber-950/60 to-surface",
  fortress: "from-slate-900/60 to-surface",
  mountains: "from-red-950/60 to-surface",
  academy: "from-indigo-950/40 to-surface",
};

export default function WorldCard({
  name,
  description,
  theme,
  progress,
  totalLessons,
  masteredLessons,
  unlocked,
  current = false,
  onClick,
  className = "",
}: WorldCardProps) {
  const borderColor = themeBorderColors[theme] ?? "border-slate-700";
  const bgGradient = themeBgColors[theme] ?? "from-slate-900/40 to-surface";

  return (
    <button
      onClick={unlocked ? onClick : undefined}
      disabled={!unlocked}
      className={`w-full text-left rounded-xl border-2 bg-gradient-to-b ${bgGradient} overflow-hidden
        transition-all duration-200
        ${unlocked ? "cursor-pointer hover:shadow-xl active:scale-[0.98]" : "opacity-50 cursor-not-allowed"}
        ${current ? `${borderColor} ring-2 ring-secondary/30` : "border-slate-700"}
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50
        ${className}`}
    >
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-text-primary">{name}</h3>
          {current && (
            <span className="text-xs font-semibold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">Current</span>
          )}
        </div>
        <p className="text-sm text-text-secondary mb-3">{description}</p>
        <div className="flex items-center gap-3">
          <ProgressBar value={progress} max={totalLessons} size="sm" className="flex-1" />
          <span className="text-xs text-text-muted tabular-nums">
            {masteredLessons}/{totalLessons}
          </span>
        </div>
      </div>
    </button>
  );
}
