"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { copy } from "@/lib/copy";

export default function SignInPage() {
  const params = useSearchParams();
  const error = params.get("error");

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold">{copy("appTitle")}</h1>
      <p className="mt-1 text-[var(--text-muted)]">{copy("signInSubtitle")}</p>
      {error && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {copy("signInFailed")}
        </p>
      )}
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/queue" })}
        className="mt-8 min-h-[48px] w-full rounded-xl bg-[var(--accent)] text-sm font-medium text-white"
      >
        {copy("continueWithGoogle")}
      </button>
    </main>
  );
}
