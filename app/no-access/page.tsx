"use client";

import { signOut, useSession } from "next-auth/react";
import { copy } from "@/lib/copy";
import { ADMIN_EMAIL_DEFAULT } from "@/lib/constants";

export default function NoAccessPage() {
  const { data: session } = useSession();
  const email = session?.user?.email ?? "";
  const admin = ADMIN_EMAIL_DEFAULT;

  const mailto = `mailto:${admin}?subject=${encodeURIComponent(
    copy("accessRequestSubject")
  )}&body=${encodeURIComponent(email)}`;

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-xl font-semibold">{copy("noAccessTitle")}</h1>
      <p className="mt-3 text-sm text-[var(--text-muted)]">{copy("noAccessBody")}</p>
      {email && (
        <p className="mt-4 text-sm font-medium">{email}</p>
      )}
      <a
        href={mailto}
        className="mt-6 inline-flex min-h-[44px] items-center text-sm font-medium text-[var(--accent)]"
      >
        {copy("requestAccess")}
      </a>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/signin" })}
        className="mt-4 block min-h-[44px] text-sm text-[var(--text-muted)]"
      >
        {copy("switchAccount")}
      </button>
    </main>
  );
}
