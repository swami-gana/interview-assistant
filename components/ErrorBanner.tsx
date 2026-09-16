import { copy } from "@/lib/copy";

export function ErrorBanner({
  message,
  onRetry,
  onDismiss,
}: {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <div className="flex items-start justify-between gap-2">
        <span>{message}</span>
        <div className="flex shrink-0 gap-2">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="font-medium text-[var(--accent)]"
            >
              {copy("retry")}
            </button>
          )}
          {onDismiss && (
            <button type="button" onClick={onDismiss} className="font-medium">
              {copy("dismiss")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
