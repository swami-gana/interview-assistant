import type { Candidate, Status } from "./types";

export type QueueFilters = {
  status: (Status | "not_yet")[];
  ageGroup: string[];
  region: string[];
  occupation: string[];
  hasPhone: boolean;
};

export const DEFAULT_QUEUE_FILTERS: QueueFilters = {
  status: [
    "not_yet",
    "No answer",
    "Asked to reschedule",
    "Not interested",
    "Invalid number",
  ],
  ageGroup: [],
  region: [],
  occupation: [],
  hasPhone: false,
};

export function isDefaultFilters(filters: QueueFilters): boolean {
  const defaultStatuses = new Set(DEFAULT_QUEUE_FILTERS.status);
  const current = new Set(filters.status);
  if (defaultStatuses.size !== current.size) return false;
  for (const s of defaultStatuses) {
    if (!current.has(s)) return false;
  }
  return (
    filters.ageGroup.length === 0 &&
    filters.region.length === 0 &&
    filters.occupation.length === 0 &&
    !filters.hasPhone
  );
}

export function distinctValues(
  candidates: Candidate[],
  key: keyof Candidate
): string[] {
  const set = new Set<string>();
  for (const c of candidates) {
    const v = c[key];
    if (typeof v === "string" && v.trim()) set.add(v.trim());
  }
  return [...set].sort();
}

export function filterCandidates(
  candidates: Candidate[],
  filters: QueueFilters
): Candidate[] {
  return candidates.filter((c) => {
    const statusKey = c.status ?? "not_yet";
    if (filters.status.length > 0 && !filters.status.includes(statusKey)) {
      return false;
    }
    if (
      filters.ageGroup.length > 0 &&
      !filters.ageGroup.includes(c.ageGroup)
    ) {
      return false;
    }
    if (filters.region.length > 0 && !filters.region.includes(c.region)) {
      return false;
    }
    if (
      filters.occupation.length > 0 &&
      !filters.occupation.includes(c.occupation)
    ) {
      return false;
    }
    if (filters.hasPhone && !c.phone.trim()) {
      return false;
    }
    return true;
  });
}

export function sortQueue(candidates: Candidate[]): Candidate[] {
  return [...candidates].sort((a, b) => {
    const aNever = a.callCount === 0;
    const bNever = b.callCount === 0;
    if (aNever && !bNever) return -1;
    if (!aNever && bNever) return 1;
    if (aNever && bNever) {
      return a.recordId.localeCompare(b.recordId);
    }
    const aTime = a.lastContactedAt
      ? new Date(a.lastContactedAt).getTime()
      : 0;
    const bTime = b.lastContactedAt
      ? new Date(b.lastContactedAt).getTime()
      : 0;
    return aTime - bTime;
  });
}
