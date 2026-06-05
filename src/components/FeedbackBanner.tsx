import { useState, useEffect, type ReactNode } from "react";

type FeedbackType = "success" | "error" | "warning" | "info";

type FeedbackBannerProps = {
  type: FeedbackType;
  message: string;
  children?: ReactNode;
  dismissible?: boolean;
  autoDismissMs?: number;
  onDismiss?: () => void;
  className?: string;
};

const typeStyles: Record<FeedbackType, { bg: string; border: string; text: string; icon: string }> = {
  success: { bg: "bg-success/15", border: "border-success/40", text: "text-success-light", icon: "✓" },
  error:   { bg: "bg-error/15", border: "border-error/40", text: "text-error-light", icon: "✗" },
  warning: { bg: "bg-warning/15", border: "border-warning/40", text: "text-warning-light", icon: "⚠" },
  info:    { bg: "bg-primary-light/20", border: "border-primary-light/40", text: "text-blue-300", icon: "ℹ" },
};

export default function FeedbackBanner({
  type,
  message,
  children,
  dismissible = false,
  autoDismissMs,
  onDismiss,
  className = "",
}: FeedbackBannerProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!autoDismissMs) return;
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, autoDismissMs);
    return () => clearTimeout(timer);
  }, [autoDismissMs, onDismiss]);

  if (!visible) return null;

  const { bg, border, text, icon } = typeStyles[type];

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-lg border ${bg} ${border} px-4 py-3 animate-slide-up ${className}`}
    >
      <span className={`font-bold text-lg leading-none ${text}`} aria-hidden="true">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${text}`}>{message}</p>
        {children}
      </div>
      {dismissible && (
        <button
          onClick={() => { setVisible(false); onDismiss?.(); }}
          className={`shrink-0 rounded p-0.5 ${text} opacity-60 hover:opacity-100 transition-opacity`}
          aria-label="Dismiss"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
