"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { fetchCandidates, flushMutationQueue, startSyncLoop } from "@/lib/sync";
export function StoreBootstrap({ children }: { children: React.ReactNode }) {
  const hydrated = useAppStore((s) => s.hydrated);
  const { status } = useSession();
  const pathname = usePathname();
  const canSync =
    status === "authenticated" &&
    pathname !== "/signin" &&
    pathname !== "/no-access";

  useEffect(() => {
    void useAppStore.getState().hydrate();
  }, []);

  useEffect(() => {
    if (!hydrated || !canSync) return;
    const stop = startSyncLoop();
    void fetchCandidates().then(() => flushMutationQueue());
    return stop;
  }, [hydrated, canSync]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[var(--text-muted)]">
        …
      </div>
    );
  }

  return <>{children}</>;
}
