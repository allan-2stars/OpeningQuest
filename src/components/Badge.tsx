import type { ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "error" | "secondary";
type BadgeSize = "sm" | "md";

type BadgeProps = {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: ReactNode;
  className?: string;
};

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-surface-light text-text-secondary",
  success: "bg-success/20 text-success-light",
  warning: "bg-warning/20 text-warning-light",
  error: "bg-error/20 text-error-light",
  secondary: "bg-secondary/20 text-secondary-light",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
};

export default function Badge({
  variant = "default",
  size = "md",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
}
