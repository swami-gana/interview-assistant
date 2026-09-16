"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { ContactActions } from "@/components/ContactActions";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { NotesEditor } from "@/components/NotesEditor";
import { StatusSheet } from "@/components/StatusSheet";
import { copy, formatCopy } from "@/lib/copy";
import { formatSnapshotDate } from "@/lib/dates";
import { useAppStore } from "@/lib/store";
import { generateSnapshot } from "@/lib/sync";

export default function CandidatePage({
  params,
}: {
  params: Promise<{ recordId: string }>;
}) {
  const { recordId } = use(params);
  const router = useRouter();
  const candidate = useAppStore((s) => s.candidates[recordId]);
  const isOnline = useAppStore((s) => s.isOnline);
  const pending = useAppStore((s) =>
    s.pendingSnapshots.some((p) => p.recordId === recordId)
  );
  const failed = useAppStore((s) => s.generationFailures[recordId]);
  const [tab, setTab] = useState<"profile" | "notes">("profile");
  const [statusOpen, setStatusOpen] = useState(false);
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const [replaceConfirm, setReplaceConfirm] = useState(false);

  if (!candidate) {
    return (
      <main className="mx-auto max-w-lg p-4">
        <p className="text-sm text-[var(--text-muted)]">{copy("loadFailed")}</p>
      </main>
    );
  }

  const statusLabel = candidate.status ?? copy("notYetContacted");

  const tryLeave = () => {
    const hasNotes =
      candidate.scratchpad.trim() || candidate.postCallSummary.trim();
    if (hasNotes && !candidate.snapshot) {
      setLeaveConfirm(true);
      return;
    }
    router.push("/queue");
  };

  const runGenerate = async () => {
    router.push("/snapshots");
    await generateSnapshot(
      recordId,
      candidate.postCallSummary,
      candidate.name
    );
  };

  const onGenerate = () => {
    if (candidate.snapshot) {
      setReplaceConfirm(true);
      return;
    }
    void runGenerate();
  };

  const field = (label: string, value: string) => (
    <div className="flex justify-between gap-4 border-b border-[var(--border)] py-3 text-sm">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="text-right">{value.trim() ? value : copy("emptyField")}</span>
    </div>
  );

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-[var(--surface)] pb-8">
      <header className="border-b border-[var(--border)] bg-white px-4 py-3">
        <button
          type="button"
          onClick={tryLeave}
          className="mb-2 min-h-[44px] text-sm text-[var(--accent)]"
        >
          ←
        </button>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-semibold">{candidate.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStatusOpen(true)}
              className="rounded-full bg-slate-100 px-3 py-2 text-xs"
            >
              {statusLabel} ▾
            </button>
            <ContactActions
              recordId={recordId}
              phone={candidate.phone}
              region={candidate.region}
              layout="detail"
            />
          </div>
        </div>
      </header>

      <div className="flex border-b border-[var(--border)] bg-white">
        {(["profile", "notes"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`min-h-[44px] flex-1 text-sm font-medium ${
              tab === key
                ? "border-b-2 border-[var(--accent)] text-[var(--accent)]"
                : "text-[var(--text-muted)]"
            }`}
          >
            {key === "profile" ? copy("profile") : copy("notes")}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="px-4">
          {field(copy("email"), candidate.email)}
          {field(copy("phone"), candidate.phone)}
          {field(copy("meditator"), candidate.meditatorStatus)}
          {field(copy("ageGroup"), candidate.ageGroup)}
          {field(copy("region"), candidate.region)}
          {field(copy("occupation"), candidate.occupation)}
          {field(copy("priorFeedback"), candidate.priorFeedback)}
          {(candidate.snapshot || pending) && (
            <div className="mt-6 rounded-xl border border-[var(--border)] bg-white p-4">
              <h2 className="text-sm font-semibold">{copy("snapshotSection")}</h2>
              {pending ? (
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  {copy("generating")}
                </p>
              ) : (
                <>
                  <p className="mt-2 text-sm">{candidate.snapshot?.summary}</p>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    {candidate.snapshot
                      ? formatSnapshotDate(candidate.snapshot.generatedAt)
                      : ""}
                    {" · "}
                    <Link
                      href={`/snapshots/${recordId}`}
                      className="text-[var(--accent)]"
                    >
                      {copy("viewSnapshot")}
                    </Link>
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "notes" && (
        <>
          {failed && (
            <div className="mx-4 mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm">
              {copy("lastAttemptFailed")}{" "}
              <button
                type="button"
                className="font-medium text-[var(--accent)]"
                onClick={() => void onGenerate()}
              >
                {copy("tryAgain")}
              </button>
            </div>
          )}
          <NotesEditor recordId={recordId} />
          <div className="px-4">
            <button
              type="button"
              disabled={!candidate.postCallSummary.trim() || !isOnline}
              onClick={() => void onGenerate()}
              className="min-h-[48px] w-full rounded-xl bg-[var(--accent)] text-sm font-medium text-white disabled:bg-slate-300"
            >
              {copy("generateSnapshot")}
            </button>
            {!isOnline && (
              <p className="mt-2 text-center text-xs text-[var(--text-muted)]">
                {copy("needsConnection")}
              </p>
            )}
          </div>
        </>
      )}

      {statusOpen && (
        <StatusSheet
          recordId={recordId}
          current={candidate.status}
          onClose={() => setStatusOpen(false)}
        />
      )}

      {leaveConfirm && (
        <ConfirmDialog
          message={copy("leaveWithoutSnapshot")}
          confirmLabel={copy("leave")}
          cancelLabel={copy("stay")}
          onConfirm={() => router.push("/queue")}
          onCancel={() => setLeaveConfirm(false)}
        />
      )}

      {replaceConfirm && (
        <ConfirmDialog
          message={copy("replaceSnapshot")}
          confirmLabel={copy("replace")}
          cancelLabel={copy("cancel")}
          onConfirm={() => {
            setReplaceConfirm(false);
            void runGenerate();
          }}
          onCancel={() => setReplaceConfirm(false)}
        />
      )}
    </main>
  );
}
