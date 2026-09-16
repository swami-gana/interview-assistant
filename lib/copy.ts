const strings = {
  appTitle: "Interview Companion",
  signInSubtitle: "Practices team",
  continueWithGoogle: "Continue with Google",
  signInFailed: "Sign-in didn't complete. Try again.",
  noAccessTitle: "No access",
  noAccessBody:
    "This tool is limited to the Practices interview team. If you think you should have access, request it below.",
  requestAccess: "Request access",
  switchAccount: "Sign in with a different account",
  signOut: "Sign out",
  signOutPending: "You have notes that haven't synced yet. Sign out anyway?",
  interviews: "Interviews",
  snapshots: "Snapshots",
  notYetContacted: "Not yet contacted",
  emptyFiltered: "No one matches these filters",
  clearFilters: "Clear filters",
  emptyNoCandidates:
    "No candidates yet. Add rows to the screener sheet, then pull down to refresh.",
  loadFailed: "Couldn't load candidates.",
  retry: "Retry",
  staleData: "Showing saved data. Pull down to retry.",
  offlineList: "You're offline. Showing saved data.",
  skippedRows:
    "{n} screener rows are missing a Record ID and were skipped.",
  profile: "Profile",
  notes: "Notes",
  scratchpad: "Scratchpad",
  postCallSummary: "Post-call summary",
  saving: "Saving…",
  saved: "Saved",
  saveFailed: "Not saved yet — we'll keep trying.",
  savedOffline: "Offline — saved on this device.",
  generateSnapshot: "Generate snapshot",
  needsConnection: "Needs a connection.",
  leaveWithoutSnapshot:
    "You haven't generated a snapshot for this interview yet. Leave anyway?",
  stay: "Stay",
  leave: "Leave",
  replaceSnapshot: "This will replace the existing snapshot. Continue?",
  cancel: "Cancel",
  replace: "Replace",
  generating: "Generating…",
  generationFailed: "Couldn't generate the snapshot for {name}.",
  generationOffline: "You're offline. Try again when you're connected.",
  lastAttemptFailed: "Last snapshot attempt failed.",
  tryAgain: "Try again",
  viewSnapshot: "View snapshot",
  showFullNotes: "Show full notes",
  hideFullNotes: "Hide full notes",
  noOpportunities: "No opportunities captured",
  emptySnapshots:
    "No snapshots yet. Generate one from a candidate's notes after your first interview.",
  snapshotsLoadFailed: "Couldn't load snapshots.",
  noStreak: "No streak yet",
  streak: "{n} week streak",
  totalSnapshots: "{n} total",
  today: "Today",
  yesterday: "Yesterday",
  call: "Call",
  whatsapp: "WA",
  email: "Email",
  phone: "Phone",
  meditator: "Meditator",
  ageGroup: "Age group",
  region: "Region",
  occupation: "Occupation",
  priorFeedback: "Prior feedback",
  opportunities: "Opportunities",
  summary: "Summary",
  quickFacts: "Quick facts",
  viewCandidate: "View candidate",
  filterStatus: "Status",
  filterAge: "Age",
  filterRegion: "Region",
  filterOccupation: "Occupation",
  filterHasPhone: "Has phone",
  emDash: "—",
  accessRequestSubject: "Interview Companion access request",
  callSubtitleOne: "1 call · last {relative}",
  callSubtitleMany: "{n} calls · last {relative}",
  benchmarkLabel: "3 / week",
  weekStreakShort: "{n} week streak",
  dismiss: "Dismiss",
  snapshotSection: "Snapshot",
  statusSheetTitle: "Status",
  emptyField: "—",
} as const;

export type CopyKey = keyof typeof strings;

export function copy(key: CopyKey): string {
  return strings[key];
}

export function formatCopy(
  key: CopyKey,
  vars: Record<string, string | number>
): string {
  let text: string = strings[key];
  for (const [k, v] of Object.entries(vars)) {
    text = text.replace(`{${k}}`, String(v));
  }
  return text;
}
