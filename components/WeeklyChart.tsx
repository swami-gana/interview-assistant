"use client";

import { copy } from "@/lib/copy";

const BENCHMARK = 3;

export function WeeklyChart({
  weeks,
}: {
  weeks: { weekStart: Date; count: number; label: string }[];
}) {
  if (weeks.length === 0) return null;

  const max = Math.max(BENCHMARK, ...weeks.map((w) => w.count), 1);
  const height = 120;

  return (
    <div className="px-4 py-2">
      <div
        className="relative flex items-end gap-2 overflow-x-auto pb-6"
        style={{ minHeight: height + 24 }}
      >
        <div
          className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-[var(--accent)]"
          style={{
            bottom: 24 + (BENCHMARK / max) * height,
          }}
          aria-hidden
        />
        {weeks.map((w) => {
          const barH = (w.count / max) * height;
          const met = w.count >= BENCHMARK;
          return (
            <div
              key={w.weekStart.toISOString()}
              className="flex min-w-[40px] flex-col items-center"
            >
              <span className="mb-1 text-xs font-medium">{w.count}</span>
              <div
                className={`w-8 rounded-t ${
                  met ? "bg-[var(--accent)]" : "bg-slate-300"
                }`}
                style={{ height: Math.max(barH, 4) }}
              />
              <span className="mt-2 text-[10px] text-[var(--text-muted)]">
                {w.label}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-[var(--text-muted)]">{copy("benchmarkLabel")}</p>
    </div>
  );
}
