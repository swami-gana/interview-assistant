"use client";

import { create } from "zustand";
import { get, set } from "idb-keyval";
import type { Candidate, Mutation, PendingSnapshot, Status } from "./types";
import { nowIso } from "./dates";

const STORAGE_KEY = "interview-companion-store";

type SaveState = "idle" | "saving" | "saved" | "failed" | "offline";

type AppState = {
  candidates: Record<string, Candidate>;
  queue: Mutation[];
  lastSyncedAt: string | null;
  skippedRows: number;
  hydrated: boolean;
  fetchError: boolean;
  isOnline: boolean;
  skippedBannerDismissed: boolean;
  pendingSnapshots: PendingSnapshot[];
  generationFailures: Record<string, boolean>;
  generationBanner: { name: string; offline?: boolean } | null;
  saveStateByRecord: Record<string, SaveState>;
  debounceTimers: Record<string, ReturnType<typeof setTimeout>>;
};

type AppActions = {
  hydrate: () => Promise<void>;
  persist: () => Promise<void>;
  setOnline: (online: boolean) => void;
  mergeFromServer: (
    candidates: Candidate[],
    skippedRows: number
  ) => Promise<void>;
  setFetchError: (failed: boolean) => void;
  dismissSkippedBanner: () => void;
  updateCandidateFields: (
    recordId: string,
    fields: Partial<Candidate>,
    options?: { debounce?: boolean; fieldKey?: string }
  ) => void;
  enqueueMutation: (mutation: Mutation) => void;
  removeAppliedMutations: (ids: string[]) => void;
  getCandidate: (recordId: string) => Candidate | undefined;
  setSaveState: (recordId: string, state: SaveState) => void;
  addPendingSnapshot: (item: PendingSnapshot) => void;
  removePendingSnapshot: (recordId: string) => void;
  setGenerationFailure: (recordId: string, failed: boolean) => void;
  setGenerationBanner: (
    banner: { name: string; offline?: boolean } | null
  ) => void;
  applySnapshotLocally: (recordId: string, snapshot: Candidate["snapshot"]) => void;
};

function mergeCandidate(
  cached: Candidate | undefined,
  server: Candidate,
  queuedFields: Set<string>
): Candidate {
  const base = cached ?? server;
  const merged: Candidate = { ...server };
  const fieldMap: Record<string, keyof Candidate> = {
    status: "status",
    callCount: "callCount",
    lastContactedAt: "lastContactedAt",
    scratchpad: "scratchpad",
    postCallSummary: "postCallSummary",
  };
  for (const [mutField, candidateKey] of Object.entries(fieldMap)) {
    if (queuedFields.has(mutField) && base) {
      (merged as Record<string, unknown>)[candidateKey] = base[candidateKey];
    }
  }
  if (queuedFields.has("snapshot") && base?.snapshot) {
    merged.snapshot = base.snapshot;
  }
  if (base) {
    merged.name = server.name || base.name;
    merged.email = server.email || base.email;
    merged.phone = server.phone || base.phone;
    merged.meditatorStatus = server.meditatorStatus || base.meditatorStatus;
    merged.ageGroup = server.ageGroup || base.ageGroup;
    merged.region = server.region || base.region;
    merged.occupation = server.occupation || base.occupation;
    merged.priorFeedback = server.priorFeedback || base.priorFeedback;
    merged.featureTag = server.featureTag || base.featureTag;
  }
  return merged;
}

function queuedFieldsForRecord(
  queue: Mutation[],
  recordId: string
): Set<string> {
  const fields = new Set<string>();
  for (const m of queue) {
    if (m.recordId !== recordId) continue;
    for (const key of Object.keys(m.fields)) {
      fields.add(key);
    }
  }
  return fields;
}

function collapseQueue(queue: Mutation[]): Mutation[] {
  const byKey = new Map<string, Mutation>();
  for (const m of queue) {
    const fieldKeys = Object.keys(m.fields);
    for (const fk of fieldKeys) {
      const key = `${m.recordId}:${fk}`;
      const existing = byKey.get(key);
      if (existing) {
        byKey.set(key, {
          ...existing,
          id: m.id,
          at: m.at,
          fields: { ...existing.fields, [fk]: m.fields[fk as keyof typeof m.fields] },
        });
      } else {
        byKey.set(key, {
          id: m.id,
          recordId: m.recordId,
          at: m.at,
          fields: { [fk]: m.fields[fk as keyof typeof m.fields] },
        });
      }
    }
  }
  const grouped = new Map<string, Mutation>();
  for (const m of byKey.values()) {
    const prev = grouped.get(m.recordId);
    if (prev) {
      grouped.set(m.recordId, {
        id: m.id,
        recordId: m.recordId,
        at: m.at,
        fields: { ...prev.fields, ...m.fields },
      });
    } else {
      grouped.set(m.recordId, m);
    }
  }
  return [...grouped.values()];
}

export const useAppStore = create<AppState & AppActions>((setState, getState) => ({
  candidates: {},
  queue: [],
  lastSyncedAt: null,
  skippedRows: 0,
  hydrated: false,
  fetchError: false,
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  skippedBannerDismissed: false,
  pendingSnapshots: [],
  generationFailures: {},
  generationBanner: null,
  saveStateByRecord: {},
  debounceTimers: {},

  hydrate: async () => {
    const data = await get(STORAGE_KEY);
    if (data) {
      const parsed = data as Partial<AppState>;
      setState({
        candidates: parsed.candidates ?? {},
        queue: parsed.queue ?? [],
        lastSyncedAt: parsed.lastSyncedAt ?? null,
        skippedRows: parsed.skippedRows ?? 0,
        hydrated: true,
      });
    } else {
      setState({ hydrated: true });
    }
  },

  persist: async () => {
    const s = getState();
    await set(STORAGE_KEY, {
      candidates: s.candidates,
      queue: s.queue,
      lastSyncedAt: s.lastSyncedAt,
      skippedRows: s.skippedRows,
    });
  },

  setOnline: (online) => setState({ isOnline: online }),

  mergeFromServer: async (incoming, skippedRows) => {
    const { candidates, queue } = getState();
    const next: Record<string, Candidate> = { ...candidates };
    const incomingIds = new Set(incoming.map((c) => c.recordId));
    for (const server of incoming) {
      const queued = queuedFieldsForRecord(queue, server.recordId);
      next[server.recordId] = mergeCandidate(
        candidates[server.recordId],
        server,
        queued
      );
    }
    for (const id of Object.keys(candidates)) {
      if (incomingIds.has(id)) continue;
      const hasQueuedMutations = queue.some((m) => m.recordId === id);
      if (!hasQueuedMutations) {
        delete next[id];
      }
    }
    setState({
      candidates: next,
      skippedRows,
      lastSyncedAt: nowIso(),
      fetchError: false,
    });
    await getState().persist();
  },

  setFetchError: (failed) => setState({ fetchError: failed }),

  dismissSkippedBanner: () => setState({ skippedBannerDismissed: true }),

  getCandidate: (recordId) => getState().candidates[recordId],

  setSaveState: (recordId, state) =>
    setState({
      saveStateByRecord: { ...getState().saveStateByRecord, [recordId]: state },
    }),

  enqueueMutation: (mutation) => {
    const queue = collapseQueue([...getState().queue, mutation]);
    setState({ queue });
    void getState().persist();
  },

  removeAppliedMutations: (ids) => {
    const idSet = new Set(ids);
    setState({ queue: getState().queue.filter((m) => !idSet.has(m.id)) });
    void getState().persist();
  },

  updateCandidateFields: (recordId, fields, options) => {
    const candidate = getState().candidates[recordId];
    if (!candidate) return;

    const apply = () => {
      const current = getState().candidates[recordId];
      if (!current) return;
      const updated = { ...current, ...fields };
      setState({
        candidates: { ...getState().candidates, [recordId]: updated },
      });
      void getState().persist();

      const mutationFields: Mutation["fields"] = {};
      if (fields.status !== undefined) mutationFields.status = fields.status;
      if (fields.callCount !== undefined)
        mutationFields.callCount = fields.callCount;
      if (fields.lastContactedAt !== undefined)
        mutationFields.lastContactedAt = fields.lastContactedAt ?? undefined;
      if (fields.scratchpad !== undefined)
        mutationFields.scratchpad = fields.scratchpad;
      if (fields.postCallSummary !== undefined)
        mutationFields.postCallSummary = fields.postCallSummary;

      if (Object.keys(mutationFields).length > 0) {
        getState().enqueueMutation({
          id: crypto.randomUUID(),
          recordId,
          at: nowIso(),
          fields: mutationFields,
        });
      }
    };

    if (options?.debounce && options.fieldKey) {
      const key = `${recordId}:${options.fieldKey}`;
      const timers = getState().debounceTimers;
      if (timers[key]) clearTimeout(timers[key]);
      getState().setSaveState(
        recordId,
        getState().isOnline ? "saving" : "offline"
      );
      const timer = setTimeout(() => {
        apply();
        void import("./sync").then((m) => m.flushMutationQueue());
        const online = getState().isOnline;
        getState().setSaveState(recordId, online ? "saving" : "offline");
      }, 800);
      setState({
        debounceTimers: { ...getState().debounceTimers, [key]: timer },
      });
      setState({
        candidates: {
          ...getState().candidates,
          [recordId]: { ...candidate, ...fields },
        },
      });
      void getState().persist();
      return;
    }

    apply();
  },

  addPendingSnapshot: (item) =>
    setState({
      pendingSnapshots: [
        item,
        ...getState().pendingSnapshots.filter(
          (p) => p.recordId !== item.recordId
        ),
      ],
    }),

  removePendingSnapshot: (recordId) =>
    setState({
      pendingSnapshots: getState().pendingSnapshots.filter(
        (p) => p.recordId !== recordId
      ),
    }),

  setGenerationFailure: (recordId, failed) =>
    setState({
      generationFailures: {
        ...getState().generationFailures,
        [recordId]: failed,
      },
    }),

  setGenerationBanner: (banner) => setState({ generationBanner: banner }),

  applySnapshotLocally: (recordId, snapshot) => {
    const c = getState().candidates[recordId];
    if (!c) return;
    setState({
      candidates: {
        ...getState().candidates,
        [recordId]: {
          ...c,
          snapshot,
          status: "Interviewed" as Status,
        },
      },
    });
    void getState().persist();
  },
}));

export function mutationId(): string {
  return crypto.randomUUID();
}
