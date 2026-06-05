type XPChipProps = {
  amount: number;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
};

const sizeStyles = {
  sm: "text-xs gap-1 px-2 py-0.5",
  md: "text-sm gap-1.5 px-2.5 py-1",
  lg: "text-base gap-1.5 px-3 py-1.5",
};

const iconSizes = { sm: "h-3.5 w-3.5", md: "h-4 w-4", lg: "h-5 w-5" };

export default function XPChip({ amount, size = "md", animated = false }: XPChipProps) {
  return (
    <span
      className={`inline-flex items-center font-bold rounded-full bg-secondary/15 text-secondary
        ${sizeStyles[size]}
        ${animated ? "animate-bounce-in" : ""}`}
      aria-label={`${amount} XP`}
    >
      <svg className={iconSizes[size]} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01z" />
      </svg>
      <span className="tabular-nums">{amount.toLocaleString()}</span>
    </span>
  );
}
