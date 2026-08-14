"use client";

import { useState } from "react";
import { CheckIcon, ArrowUturnLeftIcon, MinusIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useTap } from "@/lib/use-tap";

type Party = { name: string | null; email: string | null; phone: string | null };

type DisputeItem = {
  id: string;
  reason: string;
  createdAt: string;
  raisedBy: Party;
  booking: {
    id: string;
    title: string;
    agreedAmountKes: number;
    status: string;
    client: Party;
    worker: Party;
  };
};

type Resolution = "RELEASE_TO_WORKER" | "REFUND_CLIENT" | "NO_ACTION";

export default function DisputeQueue({ initialItems }: { initialItems: DisputeItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function resolve(id: string, resolution: Resolution) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/disputes/${id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setItems((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="relative px-6 py-8 max-w-md mx-auto w-full overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-24 w-72 h-72 bg-brand/15 rounded-full blur-3xl"
      />

      <h1 className="relative text-2xl font-bold text-white tracking-tight">Disputes</h1>
      <p className="relative text-neutral-400 text-sm mt-1 mb-6">
        {items.length} open dispute{items.length === 1 ? "" : "s"}
      </p>
      <p className="relative text-neutral-500 text-xs mb-6 bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5">
        &quot;Refund client&quot; cancels the booking and records the decision — it does not move money.
        Actually issuing a refund is a manual step in the Safaricom portal.
      </p>

      {error && <p className="relative text-red-400 text-sm mb-4">{error}</p>}

      {items.length === 0 ? (
        <div className="relative flex flex-col items-center gap-3 py-16">
          <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800">
            <ExclamationTriangleIcon className="w-6 h-6 text-neutral-700" strokeWidth={1.5} />
          </span>
          <p className="text-neutral-500 text-sm text-center">No open disputes.</p>
        </div>
      ) : (
        <ul className="relative flex flex-col gap-3">
          {items.map((d) => (
            <DisputeCard key={d.id} dispute={d} busy={busyId === d.id} onResolve={resolve} />
          ))}
        </ul>
      )}
    </main>
  );
}

function DisputeCard({
  dispute,
  busy,
  onResolve,
}: {
  dispute: DisputeItem;
  busy: boolean;
  onResolve: (id: string, resolution: Resolution) => void;
}) {
  const releaseTap = useTap();
  const refundTap = useTap();
  const dismissTap = useTap();
  const raisedByClient = dispute.raisedBy.email === dispute.booking.client.email;

  return (
    <li className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-4 shadow-lg shadow-black/30">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-white text-sm">{dispute.booking.title}</p>
          <p className="text-neutral-500 text-xs mt-0.5">KES {dispute.booking.agreedAmountKes}</p>
        </div>
        <span className="text-xs text-neutral-500">{new Date(dispute.createdAt).toLocaleDateString()}</span>
      </div>

      <p className="text-neutral-300 text-sm mt-3 bg-black/30 border border-neutral-800 rounded-xl p-3">
        {dispute.reason}
      </p>

      <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
        <div>
          <p className="text-neutral-500">Client{raisedByClient ? " (raised this)" : ""}</p>
          <p className="text-neutral-300">
            {dispute.booking.client.name ?? dispute.booking.client.email ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-neutral-500">Worker{raisedByClient ? "" : " (raised this)"}</p>
          <p className="text-neutral-300">
            {dispute.booking.worker.name ?? dispute.booking.worker.email ?? "—"}
          </p>
        </div>
      </div>

      <div className="flex gap-1.5 mt-3">
        <button
          disabled={busy}
          onClick={() => {
            releaseTap.bump();
            onResolve(dispute.id, "RELEASE_TO_WORKER");
          }}
          className="flex-1 flex items-center justify-center gap-1 bg-brand text-white text-xs font-semibold rounded-lg py-2 active:scale-[0.97] transition disabled:opacity-60"
        >
          <CheckIcon key={releaseTap.tapKey} className="w-3.5 h-3.5 animate-icon-pop" strokeWidth={2.5} />
          Release
        </button>
        <button
          disabled={busy}
          onClick={() => {
            refundTap.bump();
            onResolve(dispute.id, "REFUND_CLIENT");
          }}
          className="flex-1 flex items-center justify-center gap-1 bg-red-500/15 text-red-300 text-xs font-semibold rounded-lg py-2 active:scale-[0.97] transition disabled:opacity-60"
        >
          <ArrowUturnLeftIcon key={refundTap.tapKey} className="w-3.5 h-3.5 animate-icon-pop" strokeWidth={2.5} />
          Refund
        </button>
        <button
          disabled={busy}
          onClick={() => {
            dismissTap.bump();
            onResolve(dispute.id, "NO_ACTION");
          }}
          className="flex-1 flex items-center justify-center gap-1 bg-neutral-800 text-neutral-200 text-xs font-semibold rounded-lg py-2 active:scale-[0.97] transition disabled:opacity-60"
        >
          <MinusIcon key={dismissTap.tapKey} className="w-3.5 h-3.5 animate-icon-pop" strokeWidth={2.5} />
          Dismiss
        </button>
      </div>
    </li>
  );
}
