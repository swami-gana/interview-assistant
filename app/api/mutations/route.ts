import { NextResponse } from "next/server";
import { requireSession, sheetsConfigured } from "@/lib/auth";
import type { Mutation, Status } from "@/lib/types";
import { writeAppStateRow } from "@/lib/sheets";
import { nowIso } from "@/lib/dates";

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) {
    return new NextResponse(null, { status: 401 });
  }

  const body = (await request.json()) as { mutations?: Mutation[] };
  const mutations = body.mutations ?? [];
  const applied: string[] = [];
  const failed: string[] = [];

  if (!sheetsConfigured()) {
    console.warn("[mutations] Sheets not configured, accepting all mutations");
    return NextResponse.json({
      applied: mutations.map((m) => m.id),
      failed: [],
    });
  }

  const byRecord = new Map<string, Mutation[]>();
  for (const m of mutations) {
    const list = byRecord.get(m.recordId) ?? [];
    list.push(m);
    byRecord.set(m.recordId, list);
  }

  const email = session.user?.email ?? "";

  for (const [recordId, list] of byRecord) {
    const merged: Mutation["fields"] = {};
    const ids: string[] = [];
    for (const m of list) {
      Object.assign(merged, m.fields);
      ids.push(m.id);
    }
    try {
      await writeAppStateRow({
        recordId,
        status: merged.status as Status | null | undefined,
        callCount: merged.callCount,
        lastContactedAt: merged.lastContactedAt,
        scratchpad: merged.scratchpad,
        postCallSummary: merged.postCallSummary,
        updatedBy: email,
        updatedAt: nowIso(),
      });
      applied.push(...ids);
    } catch (err) {
      console.error("[mutations] write failed", recordId, err);
      failed.push(...ids);
    }
  }

  return NextResponse.json({ applied, failed });
}
