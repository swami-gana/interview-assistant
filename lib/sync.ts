"use client";

import { useAppStore } from "./store";
import { copy } from "./copy";

let flushInterval: ReturnType<typeof setInterval> | null = null;

export async function fetchCandidates(): Promise<boolean> {
  const store = useAppStore.getState();
  try {
    const res = await fetch("/api/candidates");
    if (!res.ok) {
      store.setFetchError(true);
      return false;
    }
    const data = (await res.json()) as {
      candidates: import("./types").Candidate[];
      skippedRows: number;
    };
    await store.mergeFromServer(data.candidates, data.skippedRows);
    return true;
  } catch {
    store.setFetchError(true);
    return false;
  }
}

export async function flushMutationQueue(): Promise<void> {
  const store = useAppStore.getState();
  if (!store.isOnline || store.queue.length === 0) return;

  const queue = [...store.queue];
  try {
    const res = await fetch("/api/mutations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mutations: queue }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as {
      applied: string[];
      failed: string[];
    };
    store.removeAppliedMutations(data.applied);

    for (const recordId of new Set(queue.map((m) => m.recordId))) {
      const stillQueued = useAppStore
        .getState()
        .queue.some((m) => m.recordId === recordId);
      if (!stillQueued) {
        const online = useAppStore.getState().isOnline;
        store.setSaveState(recordId, online ? "saved" : "offline");
        setTimeout(() => {
          const s = useAppStore.getState().saveStateByRecord[recordId];
          if (s === "saved") {
            useAppStore.getState().setSaveState(recordId, "idle");
          }
        }, 2000);
      } else {
        store.setSaveState(recordId, "failed");
      }
    }
  } catch {
    for (const m of queue) {
      useAppStore.getState().setSaveState(m.recordId, "failed");
    }
  }
}

export function startSyncLoop(): () => void {
  const onOnline = () => {
    useAppStore.getState().setOnline(true);
    void fetchCandidates();
    void flushMutationQueue();
  };
  const onOffline = () => {
    useAppStore.getState().setOnline(false);
  };

  if (typeof window !== "undefined") {
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    useAppStore.getState().setOnline(navigator.onLine);
  }

  if (flushInterval) clearInterval(flushInterval);
  flushInterval = setInterval(() => {
    void flushMutationQueue();
  }, 10000);

  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    }
    if (flushInterval) clearInterval(flushInterval);
    flushInterval = null;
  };
}

export async function generateSnapshot(
  recordId: string,
  postCallSummary: string,
  name: string
): Promise<{ ok: true } | { ok: false; offline?: boolean }> {
  const store = useAppStore.getState();
  if (!store.isOnline) {
    store.setGenerationBanner({ name, offline: true });
    return { ok: false, offline: true };
  }
  store.addPendingSnapshot({ recordId, name });
  store.setGenerationFailure(recordId, false);
  try {
    const res = await fetch("/api/snapshot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recordId, postCallSummary }),
    });
    if (!res.ok) {
      store.removePendingSnapshot(recordId);
      store.setGenerationFailure(recordId, true);
      store.setGenerationBanner({ name });
      return { ok: false };
    }
    const data = (await res.json()) as { snapshot: import("./types").Snapshot };
    store.applySnapshotLocally(recordId, data.snapshot);
    store.removePendingSnapshot(recordId);
    return { ok: true };
  } catch {
    store.removePendingSnapshot(recordId);
    store.setGenerationFailure(recordId, true);
    store.setGenerationBanner({ name });
    return { ok: false };
  }
}

export function generationBannerMessage(
  name: string,
  offline: boolean
): string {
  if (offline) return copy("generationOffline");
  return copy("generationFailed").replace("{name}", name);
}
