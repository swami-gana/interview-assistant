"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { copy } from "@/lib/copy";

export function TabBar() {
  const pathname = usePathname();
  const onSnapshots = pathname.startsWith("/snapshots");

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 border-t border-[var(--border)] bg-white"
      aria-label="Main"
    >
      <div className="mx-auto flex max-w-lg">
        <Link
          href="/queue"
          className={`flex min-h-[52px] flex-1 items-center justify-center text-sm font-medium ${
            !onSnapshots ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
          }`}
        >
          {copy("interviews")}
        </Link>
        <Link
          href="/snapshots"
          className={`flex min-h-[52px] flex-1 items-center justify-center text-sm font-medium ${
            onSnapshots ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
          }`}
        >
          {copy("snapshots")}
        </Link>
      </div>
    </nav>
  );
}
