"use client";

import type { QueueFilters } from "@/lib/filters";
import { isDefaultFilters } from "@/lib/filters";
import { copy } from "@/lib/copy";

type ChipKey = "status" | "ageGroup" | "region" | "occupation" | "hasPhone";

const labels: Record<ChipKey, string> = {
  status: copy("filterStatus"),
  ageGroup: copy("filterAge"),
  region: copy("filterRegion"),
  occupation: copy("filterOccupation"),
  hasPhone: copy("filterHasPhone"),
};

function chipLabel(key: ChipKey, filters: QueueFilters): string {
  const base = labels[key];
  if (key === "hasPhone") {
    return filters.hasPhone ? base : base;
  }
  const count = (filters[key] as string[]).length;
  if (key === "status" && isDefaultFilters(filters)) return base;
  if (count === 0) return base;
  return `${base} (${count})`;
}

function isChipActive(key: ChipKey, filters: QueueFilters): boolean {
  if (key === "hasPhone") return filters.hasPhone;
  if (key === "status") {
    return !isDefaultFilters(filters) && filters.status.length > 0;
  }
  return (filters[key] as string[]).length > 0;
}

export function FilterChips({
  filters,
  onOpen,
  onClear,
}: {
  filters: QueueFilters;
  onOpen: (chip: ChipKey) => void;
  onClear: () => void;
}) {
  const keys: ChipKey[] = [
    "status",
    "ageGroup",
    "region",
    "occupation",
    "hasPhone",
  ];

  return (
    <div className="border-b border-[var(--border)] bg-white px-2 py-2">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onOpen(key)}
            className={`shrink-0 rounded-full px-3 py-2 text-xs font-medium ${
              isChipActive(key, filters)
                ? "bg-[var(--accent)] text-white"
                : "bg-slate-100 text-[var(--text)]"
            }`}
          >
            {chipLabel(key, filters)}
          </button>
        ))}
        {!isDefaultFilters(filters) && (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 rounded-full px-3 py-2 text-xs font-medium text-[var(--accent)]"
          >
            {copy("clearFilters")}
          </button>
        )}
      </div>
    </div>
  );
}
