"use client";

import { useMemo, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { CandidateCard } from "@/components/CandidateCard";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { ErrorBanner } from "@/components/ErrorBanner";
import { FilterChips } from "@/components/FilterChips";
import { FilterSheet } from "@/components/FilterSheet";
import { StatusSheet } from "@/components/StatusSheet";
import { TabBar } from "@/components/TabBar";
import { copy, formatCopy } from "@/lib/copy";
import {
  DEFAULT_QUEUE_FILTERS,
  distinctValues,
  filterCandidates,
  sortQueue,
  type QueueFilters,
} from "@/lib/filters";
import { useAppStore } from "@/lib/store";
import { fetchCandidates, generationBannerMessage } from "@/lib/sync";

type ChipKey = "status" | "ageGroup" | "region" | "occupation" | "hasPhone";

export default function QueuePage() {
  const { data: session } = useSession();
  const candidatesMap = useAppStore((s) => s.candidates);
  const skippedRows = useAppStore((s) => s.skippedRows);
  const fetchError = useAppStore((s) => s.fetchError);
  const isOnline = useAppStore((s) => s.isOnline);
  const queue = useAppStore((s) => s.queue);
  const skippedDismissed = useAppStore((s) => s.skippedBannerDismissed);
  const dismissSkipped = useAppStore((s) => s.dismissSkippedBanner);
  const generationBanner = useAppStore((s) => s.generationBanner);
  const setGenerationBanner = useAppStore((s) => s.setGenerationBanner);

  const [filters, setFilters] = useState<QueueFilters>(DEFAULT_QUEUE_FILTERS);
  const [openChip, setOpenChip] = useState<ChipKey | null>(null);
  const [statusFor, setStatusFor] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signOutConfirm, setSignOutConfirm] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const pullStart = useRef(0);

  const all = useMemo(
    () => Object.values(candidatesMap),
    [candidatesMap]
  );

  const filtered = useMemo(
    () => sortQueue(filterCandidates(all, filters)),
    [all, filters]
  );

  const hasCache = all.length > 0;

  const onRefresh = async () => {
    await fetchCandidates();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (listRef.current && listRef.current.scrollTop === 0) {
      pullStart.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dy = e.changedTouches[0].clientY - pullStart.current;
    if (dy > 80) void onRefresh();
  };

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-[var(--surface)]">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-white px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold">{copy("interviews")}</h1>
          <span className="text-sm text-[var(--text-muted)]">{filtered.length}</span>
        </div>
        <button
          type="button"
          className="min-tap rounded-full px-2 text-xl"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Account"
        >
          ⊙
        </button>
        {menuOpen && (
          <div className="absolute right-4 top-14 z-20 rounded-lg border border-[var(--border)] bg-white p-2 shadow-lg">
            <p className="px-3 py-2 text-xs text-[var(--text-muted)]">
              {session?.user?.email}
            </p>
            <button
              type="button"
              className="min-h-[44px] w-full px-3 text-left text-sm"
              onClick={() => {
                setMenuOpen(false);
                if (queue.length > 0) setSignOutConfirm(true);
                else signOut({ callbackUrl: "/signin" });
              }}
            >
              {copy("signOut")}
            </button>
          </div>
        )}
      </header>

      {generationBanner && (
        <ErrorBanner
          message={generationBannerMessage(
            generationBanner.name,
            Boolean(generationBanner.offline)
          )}
          onRetry={() => setGenerationBanner(null)}
          onDismiss={() => setGenerationBanner(null)}
        />
      )}

      {!isOnline && hasCache && (
        <ErrorBanner message={copy("offlineList")} />
      )}
      {fetchError && hasCache && isOnline && (
        <ErrorBanner message={copy("staleData")} onRetry={() => void onRefresh()} />
      )}
      {skippedRows > 0 && !skippedDismissed && (
        <ErrorBanner
          message={formatCopy("skippedRows", { n: skippedRows })}
          onDismiss={dismissSkipped}
        />
      )}

      <FilterChips
        filters={filters}
        onOpen={(chip) => setOpenChip(chip)}
        onClear={() => setFilters(DEFAULT_QUEUE_FILTERS)}
      />

      <div
        ref={listRef}
        className="space-y-3 px-4 py-4"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {fetchError && !hasCache && (
          <EmptyState
            message={copy("loadFailed")}
            actionLabel={copy("retry")}
            onAction={() => void onRefresh()}
          />
        )}
        {!fetchError && all.length === 0 && (
          <EmptyState message={copy("emptyNoCandidates")} />
        )}
        {all.length > 0 && filtered.length === 0 && (
          <EmptyState
            message={copy("emptyFiltered")}
            actionLabel={copy("clearFilters")}
            onAction={() => setFilters(DEFAULT_QUEUE_FILTERS)}
          />
        )}
        {filtered.map((c) => (
          <CandidateCard
            key={c.recordId}
            candidate={c}
            onStatusClick={() => setStatusFor(c.recordId)}
          />
        ))}
      </div>

      <TabBar />

      {openChip && (
        <FilterSheet
          chip={openChip}
          filters={filters}
          options={
            openChip === "ageGroup"
              ? distinctValues(all, "ageGroup")
              : openChip === "region"
                ? distinctValues(all, "region")
                : openChip === "occupation"
                  ? distinctValues(all, "occupation")
                  : []
          }
          onChange={setFilters}
          onClose={() => setOpenChip(null)}
        />
      )}

      {statusFor && candidatesMap[statusFor] && (
        <StatusSheet
          recordId={statusFor}
          current={candidatesMap[statusFor].status}
          onClose={() => setStatusFor(null)}
        />
      )}

      {signOutConfirm && (
        <ConfirmDialog
          message={copy("signOutPending")}
          confirmLabel={copy("signOut")}
          cancelLabel={copy("cancel")}
          onConfirm={() => signOut({ callbackUrl: "/signin" })}
          onCancel={() => setSignOutConfirm(false)}
        />
      )}
    </div>
  );
}
