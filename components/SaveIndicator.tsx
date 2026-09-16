"use client";

import { copy } from "@/lib/copy";
import { useAppStore } from "@/lib/store";

export function SaveIndicator({ recordId }: { recordId: string }) {
  const state = useAppStore((s) => s.saveStateByRecord[recordId] ?? "idle");
  const isOnline = useAppStore((s) => s.isOnline);
  const queueLen = useAppStore((s) =>
    s.queue.filter((m) => m.recordId === recordId).length
  );

  let text = "";
  if (!isOnline && queueLen > 0) text = copy("savedOffline");
  else if (state === "saving") text = copy("saving");
  else if (state === "saved") text = copy("saved");
  else if (state === "failed" || queueLen > 0) text = copy("saveFailed");
  else if (state === "offline") text = copy("savedOffline");

  if (!text) return null;

  return (
    <span className="text-xs text-[var(--text-muted)]" aria-live="polite">
      {text}
    </span>
  );
}
