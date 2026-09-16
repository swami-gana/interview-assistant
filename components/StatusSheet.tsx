"use client";

import type { Status } from "@/lib/types";
import { STATUS_OPTIONS } from "@/lib/types";
import { copy } from "@/lib/copy";
import { useAppStore } from "@/lib/store";

function statusLabel(status: Status | "not_yet"): string {
  if (status === "not_yet") return copy("notYetContacted");
  return status;
}

export function StatusSheet({
  recordId,
  current,
  onClose,
}: {
  recordId: string;
  current: Status | null;
  onClose: () => void;
}) {
  const update = useAppStore((s) => s.updateCandidateFields);

  const pick = (value: Status | "not_yet") => {
    update(recordId, {
      status: value === "not_yet" ? null : value,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40">
      <button
        type="button"
        className="absolute inset-0"
        aria-label={copy("cancel")}
        onClick={onClose}
      />
      <div className="relative w-full max-h-[70vh] overflow-auto rounded-t-2xl bg-white p-4 pb-8">
        <h2 className="mb-3 text-base font-semibold">{copy("statusSheetTitle")}</h2>
        <ul>
          {STATUS_OPTIONS.map((opt) => {
            const selected =
              (current === null && opt === "not_yet") || current === opt;
            return (
              <li key={opt}>
                <button
                  type="button"
                  onClick={() => pick(opt)}
                  className={`flex min-h-[48px] w-full items-center justify-between border-b border-[var(--border)] text-left text-sm ${
                    selected ? "font-semibold text-[var(--accent)]" : ""
                  }`}
                >
                  {statusLabel(opt)}
                  {selected ? "✓" : ""}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
