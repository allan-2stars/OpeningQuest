import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "success" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-secondary text-primary-dark hover:bg-secondary-light focus-visible:ring-secondary/50",
  secondary:
    "bg-surface-light text-text-primary hover:bg-slate-500 focus-visible:ring-slate-400/50",
  success:
    "bg-success text-white hover:bg-success-light focus-visible:ring-success/50",
  danger:
    "bg-error text-white hover:bg-error-light focus-visible:ring-error/50",
  ghost:
    "bg-transparent text-text-secondary hover:bg-surface-light hover:text-text-primary focus-visible:ring-slate-400/50",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm gap-1.5 rounded-md",
  md: "px-5 py-2.5 text-base gap-2 rounded-lg",
  lg: "px-7 py-3.5 text-lg gap-2.5 rounded-xl",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold transition-all duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dark
        disabled:pointer-events-none disabled:opacity-50
        ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
