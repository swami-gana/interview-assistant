"use client";

import { useEffect, useRef } from "react";
import { copy } from "@/lib/copy";
import { useAppStore } from "@/lib/store";
import { SaveIndicator } from "./SaveIndicator";

function autoGrow(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

export function NotesEditor({ recordId }: { recordId: string }) {
  const candidate = useAppStore((s) => s.candidates[recordId]);
  const update = useAppStore((s) => s.updateCandidateFields);
  const scratchRef = useRef<HTMLTextAreaElement>(null);
  const summaryRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    autoGrow(scratchRef.current);
    autoGrow(summaryRef.current);
  }, [candidate?.scratchpad, candidate?.postCallSummary]);

  if (!candidate) return null;

  return (
    <div className="space-y-6 px-4 pb-8">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">{copy("scratchpad")}</span>
          <SaveIndicator recordId={recordId} />
        </div>
        <textarea
          ref={scratchRef}
          value={candidate.scratchpad}
          onChange={(e) => {
            autoGrow(e.target);
            update(
              recordId,
              { scratchpad: e.target.value },
              { debounce: true, fieldKey: "scratchpad" }
            );
          }}
          className="w-full resize-none rounded-lg border border-[var(--border)] bg-white p-3 text-sm leading-relaxed"
          rows={3}
        />
      </div>
      <div>
        <span className="mb-2 block text-sm font-medium">
          {copy("postCallSummary")}
        </span>
        <textarea
          ref={summaryRef}
          value={candidate.postCallSummary}
          onChange={(e) => {
            autoGrow(e.target);
            update(
              recordId,
              { postCallSummary: e.target.value },
              { debounce: true, fieldKey: "postCallSummary" }
            );
          }}
          onPaste={(e) => {
            const el = e.currentTarget;
            requestAnimationFrame(() => autoGrow(el));
          }}
          className="min-h-[160px] w-full resize-none rounded-lg border border-[var(--border)] bg-white p-3 text-sm leading-relaxed"
          rows={6}
        />
      </div>
    </div>
  );
}
