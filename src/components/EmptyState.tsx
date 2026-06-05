import Button from "./Button.tsx";

type EmptyStateProps = {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export default function EmptyState({
  icon = "📭",
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      <span className="text-4xl mb-4" aria-hidden="true">{icon}</span>
      <h3 className="text-lg font-bold text-text-primary mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-text-secondary max-w-sm mb-4">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
