import { NextResponse } from "next/server";
import { requireSession, sheetsConfigured } from "@/lib/auth";
import {
  buildQuickFacts,
  generateSnapshotFromSummary,
} from "@/lib/llm";
import { appendArchiveRow, readCandidatesFromSheets, writeAppStateRow } from "@/lib/sheets";
import { nowIso } from "@/lib/dates";
import type { Snapshot } from "@/lib/types";
import { fixtureCandidates } from "@/lib/fixtures";

export const maxDuration = 60;

async function getCandidate(recordId: string) {
  if (!sheetsConfigured()) {
    return fixtureCandidates().find((c) => c.recordId === recordId) ?? null;
  }
  const { candidates } = await readCandidatesFromSheets();
  return candidates.find((c) => c.recordId === recordId) ?? null;
}

function scheduleArchiveRetry(row: Parameters<typeof appendArchiveRow>[0]) {
  setTimeout(() => {
    void appendArchiveRow(row).catch((err) =>
      console.error("[snapshot] archive retry failed", err)
    );
  }, 5000);
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) {
    return new NextResponse(null, { status: 401 });
  }

  const body = (await request.json()) as {
    recordId?: string;
    postCallSummary?: string;
  };
  const recordId = body.recordId;
  const postCallSummary = body.postCallSummary ?? "";
  if (!recordId || !postCallSummary.trim()) {
    return new NextResponse(null, { status: 400 });
  }

  const candidate = await getCandidate(recordId);
  if (!candidate) {
    return new NextResponse(null, { status: 404 });
  }

  let llmResult;
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      llmResult = {
        summary:
          "Participant shared how they use practices in daily life. Details follow from the submitted notes.",
        opportunities: ["finding time for practice during busy days"],
      };
      console.warn("[snapshot] ANTHROPIC_API_KEY missing, using fixture LLM output");
    } else {
      llmResult = await generateSnapshotFromSummary(postCallSummary);
    }
  } catch (err) {
    console.error("[snapshot] LLM failed", err);
    return new NextResponse(null, { status: 502 });
  }

  const generatedAt = nowIso();
  const snapshot: Snapshot = {
    quickFacts: buildQuickFacts(candidate, generatedAt.slice(0, 10)),
    summary: llmResult.summary,
    opportunities: llmResult.opportunities,
    fullSummary: postCallSummary,
    generatedAt,
  };

  const email = session.user?.email ?? "";

  if (sheetsConfigured()) {
    try {
      await writeAppStateRow({
        recordId,
        status: "Interviewed",
        snapshot,
        postCallSummary,
        updatedBy: email,
        updatedAt: generatedAt,
      });
    } catch (err) {
      console.error("[snapshot] AppState write failed", err);
      return new NextResponse(null, { status: 500 });
    }

    const archiveRow = {
      generatedAt,
      recordId,
      name: candidate.name,
      email: candidate.email,
      featureTag: candidate.featureTag,
      quickFacts: JSON.stringify(snapshot.quickFacts),
      summary: snapshot.summary,
      opportunities: JSON.stringify(snapshot.opportunities),
      fullPostCallSummary: postCallSummary,
    };

    try {
      await appendArchiveRow(archiveRow);
    } catch (err) {
      console.error("[snapshot] Archive append failed, scheduling retry", err);
      scheduleArchiveRetry(archiveRow);
    }
  }

  return NextResponse.json({ snapshot });
}
