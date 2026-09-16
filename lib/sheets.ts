import { google, sheets_v4 } from "googleapis";
import type { Candidate, Snapshot, Status } from "./types";

const TAB_SCREENER = "Screener";
const TAB_APP_STATE = "AppState";
const TAB_ARCHIVE = "Archive";

type SheetTab = typeof TAB_SCREENER | typeof TAB_APP_STATE | typeof TAB_ARCHIVE;

function privateKey(): string {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ?? "";
  return raw.replace(/\\n/g, "\n");
}

async function getSheetsClient(): Promise<sheets_v4.Sheets> {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey(),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

function spreadsheetId(): string {
  const id = process.env.GOOGLE_SHEETS_ID;
  if (!id) throw new Error("GOOGLE_SHEETS_ID missing");
  return id;
}

function rowToMap(headers: string[], row: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  headers.forEach((h, i) => {
    map[h] = row[i] ?? "";
  });
  return map;
}

function parseSnapshotFromRow(
  map: Record<string, string>
): Snapshot | null {
  const generatedAt = map["Snapshot generated at"]?.trim();
  const summary = map["Snapshot summary"]?.trim();
  if (!generatedAt || !summary) return null;
  let quickFacts = {
    name: "",
    ageGroup: "",
    region: "",
    meditatorStatus: "",
    occupation: "",
    interviewDate: generatedAt.slice(0, 10),
  };
  try {
    const parsed = JSON.parse(map["Snapshot quick facts"] || "{}");
    quickFacts = { ...quickFacts, ...parsed };
  } catch {
    // SPEC-GAP: malformed quick facts JSON treated as empty demographics
  }
  let opportunities: string[] = [];
  try {
    opportunities = JSON.parse(map["Snapshot opportunities"] || "[]");
  } catch {
    opportunities = [];
  }
  return {
    quickFacts,
    summary,
    opportunities,
    fullSummary: map["Post-call summary"] ?? "",
    generatedAt,
  };
}

function screenerToPartial(map: Record<string, string>): Candidate | null {
  const recordId = map["Record ID"]?.trim();
  if (!recordId) return null;
  return {
    recordId,
    name: map["Name"] ?? "",
    email: map["Email"] ?? "",
    phone: map["Phone number"] ?? "",
    meditatorStatus: map["Meditator status"] ?? "",
    ageGroup: map["Age group"] ?? "",
    region: map["Region"] ?? "",
    occupation: map["Occupation"] ?? "",
    priorFeedback: map["Feedback already shared"] ?? "",
    featureTag: map["Feature tag"] ?? "",
    status: null,
    callCount: 0,
    lastContactedAt: null,
    scratchpad: "",
    postCallSummary: "",
    snapshot: null,
  };
}

function appStateOverlay(
  base: Candidate,
  map: Record<string, string>
): Candidate {
  const statusRaw = map["Status"]?.trim();
  const status = (statusRaw || null) as Status | null;
  const callCount = parseInt(map["Call count"] || "0", 10) || 0;
  const candidate: Candidate = {
    ...base,
    status: statusRaw ? status : null,
    callCount,
    lastContactedAt: map["Last contacted at"]?.trim() || null,
    scratchpad: map["Scratchpad notes"] ?? "",
    postCallSummary: map["Post-call summary"] ?? "",
    snapshot: null,
  };
  candidate.snapshot = parseSnapshotFromRow(map);
  return candidate;
}

export async function readCandidatesFromSheets(): Promise<{
  candidates: Candidate[];
  skippedRows: number;
}> {
  const sheets = await getSheetsClient();
  const id = spreadsheetId();

  const [screenerRes, appStateRes] = await Promise.all([
    sheets.spreadsheets.values.get({
      spreadsheetId: id,
      range: `${TAB_SCREENER}!A:Z`,
    }),
    sheets.spreadsheets.values.get({
      spreadsheetId: id,
      range: `${TAB_APP_STATE}!A:Z`,
    }),
  ]);

  const screenerRows = screenerRes.data.values ?? [];
  const appRows = appStateRes.data.values ?? [];
  const screenerHeaders = (screenerRows[0] ?? []) as string[];
  const appHeaders = (appRows[0] ?? []) as string[];

  const byId = new Map<string, Candidate>();
  const seen = new Set<string>();
  let skippedRows = 0;

  for (let i = 1; i < screenerRows.length; i++) {
    const row = screenerRows[i] as string[];
    const map = rowToMap(screenerHeaders, row);
    const recordId = map["Record ID"]?.trim();
    if (!recordId) {
      skippedRows += 1;
      continue;
    }
    if (seen.has(recordId)) {
      skippedRows += 1;
      continue;
    }
    seen.add(recordId);
    const c = screenerToPartial(map);
    if (c) byId.set(recordId, c);
  }

  for (let i = 1; i < appRows.length; i++) {
    const row = appRows[i] as string[];
    const map = rowToMap(appHeaders, row);
    const recordId = map["Record ID"]?.trim();
    if (!recordId) continue;
    const base =
      byId.get(recordId) ??
      ({
        recordId,
        name: "",
        email: "",
        phone: "",
        meditatorStatus: "",
        ageGroup: "",
        region: "",
        occupation: "",
        priorFeedback: "",
        featureTag: "",
        status: null,
        callCount: 0,
        lastContactedAt: null,
        scratchpad: "",
        postCallSummary: "",
        snapshot: null,
      } satisfies Candidate);
    byId.set(recordId, appStateOverlay(base, map));
  }

  return { candidates: [...byId.values()], skippedRows };
}

export type AppStateWrite = {
  recordId: string;
  status?: Status | null;
  callCount?: number;
  lastContactedAt?: string | null;
  scratchpad?: string;
  postCallSummary?: string;
  snapshot?: Snapshot | null;
  updatedBy: string;
  updatedAt: string;
};

const APP_STATE_HEADERS = [
  "Record ID",
  "Status",
  "Call count",
  "Last contacted at",
  "Scratchpad notes",
  "Post-call summary",
  "Snapshot quick facts",
  "Snapshot summary",
  "Snapshot opportunities",
  "Snapshot generated at",
  "Assigned to",
  "Last updated by",
  "Last updated at",
];

function assertWritableTab(tab: SheetTab, mode: "write" | "append") {
  if (tab === TAB_SCREENER) {
    throw new Error("Screener tab is read-only");
  }
  if (tab === TAB_ARCHIVE && mode === "write") {
    throw new Error("Archive tab is append-only");
  }
}

async function findRowIndex(
  sheets: sheets_v4.Sheets,
  tab: typeof TAB_APP_STATE,
  recordId: string
): Promise<number | null> {
  const id = spreadsheetId();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: id,
    range: `${tab}!A:A`,
  });
  const rows = res.data.values ?? [];
  for (let i = 1; i < rows.length; i++) {
    if ((rows[i]?.[0] ?? "").trim() === recordId) return i + 1;
  }
  return null;
}

function writeToRowValues(
  existing: Record<string, string>,
  patch: AppStateWrite
): string[] {
  const snap = patch.snapshot;
  const status =
    patch.status === undefined
      ? existing["Status"] ?? ""
      : patch.status === null
        ? ""
        : patch.status;
  const merged: Record<string, string> = {
    ...existing,
    "Record ID": patch.recordId,
    Status: status,
    "Call count": String(
      patch.callCount ?? existing["Call count"] ?? "0"
    ),
    "Last contacted at":
      patch.lastContactedAt === undefined
        ? existing["Last contacted at"] ?? ""
        : patch.lastContactedAt ?? "",
    "Scratchpad notes":
      patch.scratchpad ?? existing["Scratchpad notes"] ?? "",
    "Post-call summary":
      patch.postCallSummary ?? existing["Post-call summary"] ?? "",
    "Snapshot quick facts": snap
      ? JSON.stringify(snap.quickFacts)
      : existing["Snapshot quick facts"] ?? "",
    "Snapshot summary": snap
      ? snap.summary
      : existing["Snapshot summary"] ?? "",
    "Snapshot opportunities": snap
      ? JSON.stringify(snap.opportunities)
      : existing["Snapshot opportunities"] ?? "",
    "Snapshot generated at": snap
      ? snap.generatedAt
      : existing["Snapshot generated at"] ?? "",
    "Assigned to": existing["Assigned to"] ?? "",
    "Last updated by": patch.updatedBy,
    "Last updated at": patch.updatedAt,
  };
  return APP_STATE_HEADERS.map((h) => merged[h] ?? "");
}

export async function writeAppStateRow(patch: AppStateWrite): Promise<void> {
  assertWritableTab(TAB_APP_STATE, "write");
  const sheets = await getSheetsClient();
  const id = spreadsheetId();
  const rowIndex = await findRowIndex(sheets, TAB_APP_STATE, patch.recordId);

  let existing: Record<string, string> = {};
  if (rowIndex) {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: id,
      range: `${TAB_APP_STATE}!A${rowIndex}:M${rowIndex}`,
    });
    const row = (res.data.values?.[0] ?? []) as string[];
    existing = rowToMap(APP_STATE_HEADERS, row);
  }

  const values = [writeToRowValues(existing, patch)];

  if (rowIndex) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: id,
      range: `${TAB_APP_STATE}!A${rowIndex}:M${rowIndex}`,
      valueInputOption: "RAW",
      requestBody: { values },
    });
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId: id,
      range: `${TAB_APP_STATE}!A:M`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values },
    });
  }
}

export type ArchiveRow = {
  generatedAt: string;
  recordId: string;
  name: string;
  email: string;
  featureTag: string;
  quickFacts: string;
  summary: string;
  opportunities: string;
  fullPostCallSummary: string;
};

export async function appendArchiveRow(row: ArchiveRow): Promise<void> {
  assertWritableTab(TAB_ARCHIVE, "append");
  const sheets = await getSheetsClient();
  const id = spreadsheetId();
  const values = [
    [
      row.generatedAt,
      row.recordId,
      row.name,
      row.email,
      row.featureTag,
      row.quickFacts,
      row.summary,
      row.opportunities,
      row.fullPostCallSummary,
    ],
  ];
  await sheets.spreadsheets.values.append({
    spreadsheetId: id,
    range: `${TAB_ARCHIVE}!A:I`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });
}
