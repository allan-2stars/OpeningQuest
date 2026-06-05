import type { ReactNode } from "react";

type PageShellProps = {
  title?: string;
  children: ReactNode;
  className?: string;
};

export default function PageShell({ title, children, className = "" }: PageShellProps) {
  return (
    <div className={`mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8 ${className}`}>
      {title && (
        <h2 className="text-2xl font-bold text-text-primary mb-4">{title}</h2>
      )}
      {children}
    </div>
  );
}
