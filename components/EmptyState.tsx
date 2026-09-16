import { copy } from "@/lib/copy";

export function EmptyState({
  message,
  actionLabel,
  onAction,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="px-4 py-12 text-center">
      <p className="text-sm text-[var(--text-muted)]">{message}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 min-h-[44px] px-4 text-sm font-medium text-[var(--accent)]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
