"use client";

import { useMemo } from "react";
import { SnapshotCard } from "@/components/SnapshotCard";
import { StreakBadge } from "@/components/StreakBadge";
import { TabBar } from "@/components/TabBar";
import { WeeklyChart } from "@/components/WeeklyChart";
import { EmptyState } from "@/components/EmptyState";
import { ErrorBanner } from "@/components/ErrorBanner";
import { copy } from "@/lib/copy";
import { computeStreak, formatFeedDateHeader, getWeekBuckets } from "@/lib/dates";
import { useAppStore } from "@/lib/store";
import { generationBannerMessage } from "@/lib/sync";
import type { Candidate } from "@/lib/types";

function feedHeader(iso: string): string {
  const key = formatFeedDateHeader(iso);
  if (key === "today") return copy("today");
  if (key === "yesterday") return copy("yesterday");
  return key;
}

export default function SnapshotsPage() {
  const candidatesMap = useAppStore((s) => s.candidates);
  const pending = useAppStore((s) => s.pendingSnapshots);
  const generationBanner = useAppStore((s) => s.generationBanner);
  const setGenerationBanner = useAppStore((s) => s.setGenerationBanner);

  const withSnapshots = useMemo(() => {
    return Object.values(candidatesMap).filter(
      (c) => c.snapshot?.generatedAt
    ) as Candidate[];
  }, [candidatesMap]);

  const sorted = useMemo(() => {
    return [...withSnapshots].sort(
      (a, b) =>
        new Date(b.snapshot!.generatedAt).getTime() -
        new Date(a.snapshot!.generatedAt).getTime()
    );
  }, [withSnapshots]);

  const dates = sorted.map((c) => c.snapshot!.generatedAt);
  const weeks = getWeekBuckets(dates, 8);
  const streak = computeStreak(dates);
  const total = sorted.length;

  const groups = useMemo(() => {
    const map = new Map<string, Candidate[]>();
    for (const c of sorted) {
      const h = feedHeader(c.snapshot!.generatedAt);
      const list = map.get(h) ?? [];
      list.push(c);
      map.set(h, list);
    }
    return [...map.entries()];
  }, [sorted]);

  const pendingCards = pending
    .map((p) => candidatesMap[p.recordId])
    .filter(Boolean) as Candidate[];

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-[var(--surface)]">
      <header className="border-b border-[var(--border)] bg-white px-4 py-3">
        <h1 className="text-lg font-semibold">{copy("snapshots")}</h1>
      </header>

      {generationBanner && (
        <ErrorBanner
          message={generationBannerMessage(
            generationBanner.name,
            Boolean(generationBanner.offline)
          )}
          onDismiss={() => setGenerationBanner(null)}
        />
      )}

      {total === 0 && pendingCards.length === 0 ? (
        <EmptyState message={copy("emptySnapshots")} />
      ) : (
        <>
          <StreakBadge streak={streak} total={total} />
          <WeeklyChart weeks={weeks} />
          <div className="space-y-6 px-4 pb-24">
            {pendingCards.map((c) => (
              <SnapshotCard key={`pending-${c.recordId}`} candidate={c} pending />
            ))}
            {groups.map(([header, items]) => (
              <section key={header}>
                <h2 className="mb-2 text-sm font-semibold text-[var(--text-muted)]">
                  {header}
                </h2>
                <div className="space-y-3">
                  {items.map((c) => (
                    <SnapshotCard key={c.recordId} candidate={c} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}

      <TabBar />
    </div>
  );
}
