"use client";

import { useState } from "react";
import { CheckIcon, XMarkIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { useTap } from "@/lib/use-tap";

type PendingProfile = {
  id: string;
  category: string;
  county: string;
  area: string;
  user: { name: string | null; email: string | null; phone: string | null };
  idImageUrl: string | null;
};

export default function VerificationQueue({ initialItems }: { initialItems: PendingProfile[] }) {
  const [items, setItems] = useState(initialItems);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(id: string, action: "approve" | "reject") {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/verifications/${id}/${action}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setItems((prev) => prev.filter((p) => p.id !== id));
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

      <h1 className="relative text-2xl font-bold text-white tracking-tight">Verification queue</h1>
      <p className="relative text-neutral-400 text-sm mt-1 mb-6">
        {items.length} worker{items.length === 1 ? "" : "s"} awaiting review
      </p>

      {error && <p className="relative text-red-400 text-sm mb-4">{error}</p>}

      {items.length === 0 ? (
        <div className="relative flex flex-col items-center gap-3 py-16">
          <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800">
            <ShieldCheckIcon className="w-6 h-6 text-neutral-700" strokeWidth={1.5} />
          </span>
          <p className="text-neutral-500 text-sm text-center">Nothing pending review.</p>
        </div>
      ) : (
        <ul className="relative flex flex-col gap-3">
          {items.map((p) => (
            <QueueCard key={p.id} profile={p} busy={busyId === p.id} onAct={act} />
          ))}
        </ul>
      )}
    </main>
  );
}

function QueueCard({
  profile,
  busy,
  onAct,
}: {
  profile: PendingProfile;
  busy: boolean;
  onAct: (id: string, action: "approve" | "reject") => void;
}) {
  const approveTap = useTap();
  const rejectTap = useTap();

  return (
    <li className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-4 shadow-lg shadow-black/30">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-white text-sm">{profile.user.name ?? "LinkMeApp user"}</p>
          <p className="text-neutral-400 text-xs mt-0.5">
            {profile.category} · {profile.area}, {profile.county}
          </p>
          <p className="text-neutral-500 text-xs mt-0.5">
            {profile.user.email ?? profile.user.phone ?? "No contact on file"}
          </p>
        </div>
      </div>

      {profile.idImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed Supabase URL, not a next/image-configured domain
        <img
          src={profile.idImageUrl}
          alt="Submitted ID"
          className="w-full max-h-64 object-contain rounded-xl border border-neutral-800 bg-black mt-3"
        />
      ) : (
        <p className="text-neutral-500 text-xs mt-3">No ID photo on file.</p>
      )}

      <div className="flex gap-2 mt-3">
        <button
          disabled={busy}
          onClick={() => {
            approveTap.bump();
            onAct(profile.id, "approve");
          }}
          className="flex-1 flex items-center justify-center gap-1.5 bg-brand text-white text-sm font-semibold rounded-lg py-2 active:scale-[0.97] transition disabled:opacity-60"
        >
          <CheckIcon key={approveTap.tapKey} className="w-4 h-4 animate-icon-pop" strokeWidth={2.5} />
          Approve
        </button>
        <button
          disabled={busy}
          onClick={() => {
            rejectTap.bump();
            onAct(profile.id, "reject");
          }}
          className="flex-1 flex items-center justify-center gap-1.5 bg-neutral-800 text-neutral-200 text-sm font-semibold rounded-lg py-2 active:scale-[0.97] transition disabled:opacity-60"
        >
          <XMarkIcon key={rejectTap.tapKey} className="w-4 h-4 animate-icon-pop" strokeWidth={2.5} />
          Reject
        </button>
      </div>
    </li>
  );
}
