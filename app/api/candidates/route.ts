import { NextResponse } from "next/server";
import { requireSession, sheetsConfigured } from "@/lib/auth";
import { fixtureCandidatesResponse } from "@/lib/fixtures";
import { readCandidatesFromSheets } from "@/lib/sheets";

export async function GET() {
  const session = await requireSession();
  if (!session) {
    return new NextResponse(null, { status: 401 });
  }

  if (!sheetsConfigured()) {
    console.warn("[candidates] Sheets not configured, returning fixtures");
    return NextResponse.json(fixtureCandidatesResponse());
  }

  try {
    const data = await readCandidatesFromSheets();
    return NextResponse.json(data);
  } catch (err) {
    console.warn("[candidates] Sheets read failed, returning fixtures", err);
    return NextResponse.json(fixtureCandidatesResponse());
  }
}
