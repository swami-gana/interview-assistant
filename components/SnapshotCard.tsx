"use client";

import Link from "next/link";
import type { Candidate } from "@/lib/types";
import { formatTime } from "@/lib/dates";
import { copy } from "@/lib/copy";

export function SnapshotCard({
  candidate,
  pending,
}: {
  candidate: Candidate;
  pending?: boolean;
}) {
  const snap = candidate.snapshot;
  const line =
    snap?.summary.replace(/\s+/g, " ").slice(0, 120) ??
    (pending ? copy("generating") : "");

  return (
    <Link
      href={`/snapshots/${candidate.recordId}`}
      className="block rounded-xl border border-[var(--border)] bg-white p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold">{candidate.name}</h3>
        <span className="text-xs text-[var(--text-muted)]">
          {snap ? formatTime(snap.generatedAt) : ""}
        </span>
      </div>
      <p className="mt-2 truncate text-sm text-[var(--text-muted)]">
        {pending ? copy("generating") : line}
      </p>
    </Link>
  );
}
