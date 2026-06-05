type KeyChipProps = {
  amount: number;
  size?: "sm" | "md" | "lg";
};

const sizeStyles = {
  sm: "text-xs gap-1 px-2 py-0.5",
  md: "text-sm gap-1.5 px-2.5 py-1",
  lg: "text-base gap-1.5 px-3 py-1.5",
};

const iconSizes = { sm: "h-3.5 w-3.5", md: "h-4 w-4", lg: "h-5 w-5" };

export default function KeyChip({ amount, size = "md" }: KeyChipProps) {
  return (
    <span
      className={`inline-flex items-center font-bold rounded-full bg-warning/15 text-warning
        ${sizeStyles[size]}`}
      aria-label={`${amount} keys`}
    >
      <svg className={iconSizes[size]} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
      </svg>
      <span className="tabular-nums">{amount.toLocaleString()}</span>
    </span>
  );
}
