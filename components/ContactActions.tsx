"use client";

import { copy } from "@/lib/copy";
import { nowIso } from "@/lib/dates";
import { useAppStore } from "@/lib/store";

function digitsOnly(phone: string): string {
  return phone.replace(/[\s()\-+]/g, "");
}

export function ContactActions({
  recordId,
  phone,
  region,
  layout = "card",
}: {
  recordId: string;
  phone: string;
  region: string;
  layout?: "card" | "detail";
}) {
  const update = useAppStore((s) => s.updateCandidateFields);
  const hasPhone = phone.trim().length > 0;
  const indiaFirst = region === "India";

  const bumpContact = () => {
    const c = useAppStore.getState().candidates[recordId];
    if (!c) return;
    update(recordId, {
      callCount: c.callCount + 1,
      lastContactedAt: nowIso(),
    });
  };

  const callBtn = (
    <a
      href={hasPhone ? `tel:${phone}` : undefined}
      onClick={(e) => {
        if (!hasPhone) {
          e.preventDefault();
          return;
        }
        bumpContact();
      }}
      className={`inline-flex min-h-[44px] items-center justify-center rounded-lg px-4 text-sm font-medium ${
        !hasPhone
          ? "cursor-not-allowed bg-slate-100 text-slate-400"
          : indiaFirst
            ? "bg-[var(--accent)] text-white"
            : "border border-[var(--border)] bg-white"
      }`}
      aria-disabled={!hasPhone}
    >
      {copy("call")}
    </a>
  );

  const waBtn = (
    <a
      href={
        hasPhone
          ? `https://wa.me/${digitsOnly(phone)}`
          : undefined
      }
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        if (!hasPhone) {
          e.preventDefault();
          return;
        }
        bumpContact();
      }}
      className={`inline-flex min-h-[44px] items-center justify-center rounded-lg px-4 text-sm font-medium ${
        !hasPhone
          ? "cursor-not-allowed bg-slate-100 text-slate-400"
          : !indiaFirst
            ? "bg-[var(--accent)] text-white"
            : "border border-[var(--border)] bg-white"
      }`}
      aria-disabled={!hasPhone}
    >
      {copy("whatsapp")}
    </a>
  );

  const order = indiaFirst ? [callBtn, waBtn] : [waBtn, callBtn];

  return (
    <div
      className={`flex gap-2 ${
        layout === "detail" ? "flex-wrap" : "justify-end"
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {order[0]}
      {order[1]}
    </div>
  );
}
