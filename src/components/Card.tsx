import type { ReactNode } from "react";

type CardProps = {
  header?: ReactNode;
  footer?: ReactNode;
  hover?: boolean;
  children: ReactNode;
  className?: string;
};

export default function Card({
  header,
  footer,
  hover = false,
  children,
  className = "",
}: CardProps) {
  return (
    <div
      className={`rounded-xl border border-slate-700 bg-surface overflow-hidden
        ${hover ? "transition-shadow duration-200 hover:shadow-lg hover:shadow-primary/10 hover:border-slate-600" : ""}
        ${className}`}
    >
      {header && (
        <div className="border-b border-slate-700 px-5 py-3 text-sm font-semibold text-text-secondary">
          {header}
        </div>
      )}
      <div className="px-5 py-4">{children}</div>
      {footer && (
        <div className="border-t border-slate-700 px-5 py-3">{footer}</div>
      )}
    </div>
  );
}
