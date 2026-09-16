import { copy, formatCopy } from "@/lib/copy";

export function StreakBadge({
  streak,
  total,
}: {
  streak: number;
  total: number;
}) {
  return (
    <div className="flex items-baseline justify-between px-4 py-3">
      <span className="text-lg font-semibold">
        {streak === 0
          ? copy("noStreak")
          : formatCopy("streak", { n: streak })}
      </span>
      <span className="text-sm text-[var(--text-muted)]">
        {formatCopy("totalSnapshots", { n: total })}
      </span>
    </div>
  );
}
