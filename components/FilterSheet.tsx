"use client";

import type { QueueFilters } from "@/lib/filters";
import { DEFAULT_QUEUE_FILTERS } from "@/lib/filters";
import type { Status } from "@/lib/types";
import { STATUS_OPTIONS } from "@/lib/types";
import { copy } from "@/lib/copy";

type ChipKey = "status" | "ageGroup" | "region" | "occupation" | "hasPhone";

export function FilterSheet({
  chip,
  filters,
  options,
  onChange,
  onClose,
}: {
  chip: ChipKey;
  filters: QueueFilters;
  options: string[];
  onChange: (next: QueueFilters) => void;
  onClose: () => void;
}) {
  const toggleMulti = (value: string) => {
    const key = chip as "ageGroup" | "region" | "occupation";
    if (chip === "hasPhone" || chip === "status") return;
    const set = new Set(filters[key]);
    if (set.has(value)) set.delete(value);
    else set.add(value);
    onChange({ ...filters, [key]: [...set] });
  };

  const toggleStatus = (value: Status | "not_yet") => {
    const set = new Set(filters.status);
    if (set.has(value)) set.delete(value);
    else set.add(value);
    onChange({ ...filters, status: [...set] });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40">
      <button type="button" className="absolute inset-0" onClick={onClose} />
      <div className="relative max-h-[70vh] w-full overflow-auto rounded-t-2xl bg-white p-4 pb-8">
        {chip === "status" && (
          <ul>
            {STATUS_OPTIONS.map((opt) => (
              <li key={opt}>
                <button
                  type="button"
                  onClick={() => toggleStatus(opt)}
                  className="flex min-h-[44px] w-full border-b border-[var(--border)] text-left text-sm"
                >
                  {filters.status.includes(opt) ? "☑ " : "☐ "}
                  {opt === "not_yet" ? copy("notYetContacted") : opt}
                </button>
              </li>
            ))}
          </ul>
        )}
        {chip === "hasPhone" && (
          <button
            type="button"
            className="min-h-[44px] text-sm"
            onClick={() =>
              onChange({ ...filters, hasPhone: !filters.hasPhone })
            }
          >
            {filters.hasPhone ? "☑ " : "☐ "}
            {copy("filterHasPhone")}
          </button>
        )}
        {(chip === "ageGroup" ||
          chip === "region" ||
          chip === "occupation") &&
          options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => toggleMulti(opt)}
              className="flex min-h-[44px] w-full border-b border-[var(--border)] text-left text-sm"
            >
              {(filters[chip] as string[]).includes(opt) ? "☑ " : "☐ "}
              {opt}
            </button>
          ))}
        <button
          type="button"
          className="mt-4 min-h-[44px] text-sm text-[var(--accent)]"
          onClick={() => onChange({ ...DEFAULT_QUEUE_FILTERS })}
        >
          {copy("clearFilters")}
        </button>
      </div>
    </div>
  );
}
