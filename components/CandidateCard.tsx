"use client";

import Link from "next/link";
import type { Candidate } from "@/lib/types";
import { copy, formatCopy } from "@/lib/copy";
import { formatRelativeContact } from "@/lib/dates";
import { ContactActions } from "./ContactActions";

function statusTag(status: Candidate["status"]): string {
  if (!status) return copy("notYetContacted");
  return status;
}

function callSubtitle(c: Candidate): string {
  if (c.callCount === 0) return copy("notYetContacted");
  const rel = formatRelativeContact(c.lastContactedAt);
  if (c.callCount === 1) {
    return formatCopy("callSubtitleOne", { relative: rel });
  }
  return formatCopy("callSubtitleMany", { n: c.callCount, relative: rel });
}

export function CandidateCard({
  candidate,
  onStatusClick,
}: {
  candidate: Candidate;
  onStatusClick: () => void;
}) {
  return (
    <article className="rounded-xl border border-[var(--border)] bg-white p-4">
      <Link href={`/candidate/${candidate.recordId}`} className="block">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold">{candidate.name}</h3>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onStatusClick();
            }}
            className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs"
          >
            {statusTag(candidate.status)}
          </button>
        </div>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {[candidate.region, candidate.meditatorStatus]
            .filter(Boolean)
            .join(" · ") || copy("emptyField")}
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {callSubtitle(candidate)}
        </p>
      </Link>
      <div className="mt-3">
        <ContactActions
          recordId={candidate.recordId}
          phone={candidate.phone}
          region={candidate.region}
        />
      </div>
    </article>
  );
}
