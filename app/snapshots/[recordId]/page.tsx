"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { copy } from "@/lib/copy";
import { useAppStore } from "@/lib/store";

export default function SnapshotDetailPage({
  params,
}: {
  params: Promise<{ recordId: string }>;
}) {
  const { recordId } = use(params);
  const router = useRouter();
  const candidate = useAppStore((s) => s.candidates[recordId]);
  const [showFull, setShowFull] = useState(false);

  if (!candidate?.snapshot) {
    return (
      <main className="mx-auto max-w-lg p-4">
        <button type="button" onClick={() => router.back()} className="text-sm text-[var(--accent)]">
          ←
        </button>
        <p className="mt-4 text-sm">{copy("snapshotsLoadFailed")}</p>
      </main>
    );
  }

  const snap = candidate.snapshot;
  const facts = [
    [copy("email"), candidate.email],
    [copy("ageGroup"), snap.quickFacts.ageGroup],
    [copy("region"), snap.quickFacts.region],
    [copy("meditator"), snap.quickFacts.meditatorStatus],
    [copy("occupation"), snap.quickFacts.occupation],
  ];

  return (
    <main className="mx-auto max-w-lg px-4 py-4 pb-12">
      <button
        type="button"
        onClick={() => router.back()}
        className="min-h-[44px] text-sm text-[var(--accent)]"
      >
        ←
      </button>
      <h1 className="mt-2 text-xl font-semibold">{candidate.name}</h1>
      <Link
        href={`/candidate/${recordId}`}
        className="text-sm text-[var(--accent)]"
      >
        {copy("viewCandidate")}
      </Link>

      <h2 className="mt-6 text-sm font-semibold">{copy("quickFacts")}</h2>
      <dl className="mt-2 space-y-2 text-sm">
        {facts.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-[var(--text-muted)]">{label}</dt>
            <dd>{value.trim() ? value : copy("emptyField")}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-6 text-sm font-semibold">{copy("summary")}</h2>
      <p className="mt-2 text-sm leading-relaxed">{snap.summary}</p>

      <h2 className="mt-6 text-sm font-semibold">{copy("opportunities")}</h2>
      {snap.opportunities.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {copy("noOpportunities")}
        </p>
      ) : (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {snap.opportunities.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
      )}

      <button
        type="button"
        className="mt-6 min-h-[44px] text-sm font-medium text-[var(--accent)]"
        onClick={() => setShowFull((v) => !v)}
      >
        {showFull ? copy("hideFullNotes") : copy("showFullNotes")}
      </button>
      {showFull && (
        <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-muted)]">
          {snap.fullSummary}
        </p>
      )}
    </main>
  );
}
