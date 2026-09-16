export type Status =
  | "No answer"
  | "Asked to reschedule"
  | "Not interested"
  | "Invalid number"
  | "Interviewed";

export type QuickFacts = {
  name: string;
  ageGroup: string;
  region: string;
  meditatorStatus: string;
  occupation: string;
  interviewDate: string;
};

export type Snapshot = {
  quickFacts: QuickFacts;
  summary: string;
  opportunities: string[];
  fullSummary: string;
  generatedAt: string;
};

export type Candidate = {
  recordId: string;
  name: string;
  email: string;
  phone: string;
  meditatorStatus: string;
  ageGroup: string;
  region: string;
  occupation: string;
  priorFeedback: string;
  featureTag: string;
  status: Status | null;
  callCount: number;
  lastContactedAt: string | null;
  scratchpad: string;
  postCallSummary: string;
  snapshot: Snapshot | null;
};

export type Mutation = {
  id: string;
  recordId: string;
  at: string;
  fields: Partial<{
    status: Status | null;
    callCount: number;
    lastContactedAt: string;
    scratchpad: string;
    postCallSummary: string;
  }>;
};

export type PersistedStore = {
  candidates: Record<string, Candidate>;
  queue: Mutation[];
  lastSyncedAt: string | null;
  skippedRows: number;
};

export type PendingSnapshot = {
  recordId: string;
  name: string;
};

export const STATUS_OPTIONS: (Status | "not_yet")[] = [
  "not_yet",
  "No answer",
  "Asked to reschedule",
  "Not interested",
  "Invalid number",
  "Interviewed",
];
