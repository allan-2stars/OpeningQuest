type ProgressBarProps = {
  value: number;
  max?: number;
  variant?: "success" | "warning" | "primary";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
};

const variantColors = {
  success: "bg-success",
  warning: "bg-warning",
  primary: "bg-secondary",
};

const sizeHeights = {
  sm: "h-2",
  md: "h-3",
  lg: "h-4",
};

export default function ProgressBar({
  value,
  max = 100,
  variant = "primary",
  size = "md",
  showLabel = false,
  animated = true,
  className = "",
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`flex-1 rounded-full bg-slate-700 overflow-hidden ${sizeHeights[size]}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${variantColors[variant]} ${animated ? "animate-progress-fill" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-semibold text-text-secondary tabular-nums min-w-[3ch]">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
}
