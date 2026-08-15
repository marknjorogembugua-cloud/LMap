"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  CheckIcon,
  XMarkIcon,
  MapPinIcon,
  BanknotesIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { guessCategoryIcon } from "@/lib/categories";
import StatusBadge from "@/components/StatusBadge";
import ShareButton from "@/components/ShareButton";
import BackButton from "@/components/BackButton";
import { useSession } from "@/lib/use-session";
import { useTap } from "@/lib/use-tap";

export type Job = {
  id: string;
  title: string;
  category: string;
  description: string;
  county: string;
  area: string;
  budgetKes: number;
  urgency: string;
  status: string;
  client: { id: string; name: string | null; phone: string | null };
  bookings: {
    id: string;
    status: string;
    agreedAmountKes: number;
    worker: { id: string; name: string | null; phone: string | null };
  }[];
};

export default function JobDetailView({ id, initialJob }: { id: string; initialJob: Job | null }) {
  const { user } = useSession();
  const [job, setJob] = useState<Job | null>(initialJob);
  const [amount, setAmount] = useState(initialJob ? String(initialJob.budgetKes) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/gigs/${id}`);
    const data = await res.json();
    setJob(data.gig ?? null);
    if (data.gig) setAmount(String(data.gig.budgetKes));
  }, [id]);

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !job) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gigId: job.id, workerId: user.id, agreedAmountKes: Number(amount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not apply");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not apply");
    } finally {
      setBusy(false);
    }
  }

  async function act(bookingId: string, action: "accept" | "decline") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/${action}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (!job) return <p className="text-center text-neutral-500 text-sm py-16">Job not found.</p>;

  const isClient = user?.id === job.client.id;
  const myBooking = job.bookings.find((b) => b.worker.id === user?.id);
  const Icon = guessCategoryIcon(job.category);

  return (
    <main className="relative px-6 py-8 max-w-md mx-auto w-full overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-24 w-72 h-72 bg-brand/15 rounded-full blur-3xl"
      />

      <div className="relative flex items-center justify-between mb-3">
        <BackButton fallbackHref="/jobs" className="" />
        <ShareButton title={job.title} text={`${job.title} · ${job.category} on LinkMeUp`} />
      </div>

      <div className="relative bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-5 shadow-lg shadow-black/30">
        <div className="flex items-start gap-3">
          <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand/10 text-brand shrink-0">
            {/* eslint-disable-next-line react-hooks/static-components -- guessCategoryIcon only ever returns one of a fixed set of stable heroicon components */}
            <Icon className="w-6 h-6" strokeWidth={1.75} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-xl font-bold text-white leading-snug">{job.title}</h1>
              <StatusBadge status={job.status} />
            </div>
            <p className="text-neutral-400 text-sm mt-1 flex items-center gap-1">
              <MapPinIcon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
              {job.category} · {job.area}, {job.county}
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm text-neutral-200 whitespace-pre-wrap">{job.description}</p>

        <div className="flex items-center justify-between mt-5 bg-black/30 border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand/10 text-brand shrink-0">
              <BanknotesIcon className="w-4 h-4" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-xs text-neutral-500">Budget</p>
              <p className="font-bold text-brand">KES {job.budgetKes}</p>
            </div>
          </div>
          <StatusBadge status={job.urgency} />
        </div>
      </div>

      {error && <p className="relative text-red-400 text-sm mt-4">{error}</p>}

      {isClient ? (
        <div className="relative mt-6">
          <h2 className="font-semibold text-white mb-3">Applicants ({job.bookings.length})</h2>
          {job.bookings.length === 0 ? (
            <p className="text-neutral-500 text-sm">No applicants yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {job.bookings.map((b) => (
                <ApplicantRow key={b.id} booking={b} busy={busy} onAct={act} />
              ))}
            </ul>
          )}
        </div>
      ) : myBooking ? (
        <Link
          href={`/messages/${myBooking.id}`}
          className="relative group mt-6 flex items-center justify-between bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 text-white font-semibold rounded-2xl shadow-lg shadow-black/30 px-5 py-4 active:scale-[0.98] transition"
        >
          You applied · View conversation
          <ChevronRightIcon
            className="w-4 h-4 text-neutral-500 group-active:translate-x-0.5 transition shrink-0"
            strokeWidth={2}
          />
        </Link>
      ) : job.status === "OPEN" && user?.primaryRole === "WORKER" && user.workerProfile ? (
        <form
          onSubmit={apply}
          className="relative mt-6 flex flex-col gap-3 bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-4 shadow-lg shadow-black/30"
        >
          <p className="font-semibold text-sm text-white">Apply for this job</p>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-neutral-300">Your price (KES)</span>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-3.5 py-2.5 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="bg-brand text-white font-semibold rounded-xl shadow-lg shadow-brand/20 py-3 disabled:opacity-60 active:scale-[0.98] transition"
          >
            {busy ? "Applying..." : "Apply now"}
          </button>
        </form>
      ) : job.status === "OPEN" && user?.primaryRole === "WORKER" && !user.workerProfile ? (
        <Link
          href="/onboarding/worker"
          className="relative mt-6 block text-center bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold rounded-xl py-3.5 active:scale-[0.98] transition"
        >
          Complete your worker profile to apply
        </Link>
      ) : null}
    </main>
  );
}

function ApplicantRow({
  booking,
  busy,
  onAct,
}: {
  booking: Job["bookings"][number];
  busy: boolean;
  onAct: (id: string, action: "accept" | "decline") => void;
}) {
  const accept = useTap();
  const decline = useTap();

  return (
    <li className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-xl p-3.5 shadow-sm shadow-black/20">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/workers/${booking.worker.id}`} className="font-medium text-sm text-white">
            {booking.worker.name ?? "Worker"}
          </Link>
          <p className="text-xs text-neutral-500 mt-0.5">KES {booking.agreedAmountKes}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>
      {booking.status === "REQUESTED" && (
        <div className="flex gap-2 mt-3">
          <button
            disabled={busy}
            onClick={() => {
              accept.bump();
              onAct(booking.id, "accept");
            }}
            className="flex-1 flex items-center justify-center gap-1.5 bg-brand text-white text-sm font-semibold rounded-lg py-2 active:scale-[0.97] transition disabled:opacity-60"
          >
            <CheckIcon key={accept.tapKey} className="w-4 h-4 animate-icon-pop" strokeWidth={2.5} />
            Accept
          </button>
          <button
            disabled={busy}
            onClick={() => {
              decline.bump();
              onAct(booking.id, "decline");
            }}
            className="flex-1 flex items-center justify-center gap-1.5 bg-neutral-800 text-neutral-200 text-sm font-semibold rounded-lg py-2 active:scale-[0.97] transition disabled:opacity-60"
          >
            <XMarkIcon key={decline.tapKey} className="w-4 h-4 animate-icon-pop" strokeWidth={2.5} />
            Decline
          </button>
        </div>
      )}
      {booking.status !== "REQUESTED" && (
        <Link
          href={`/messages/${booking.id}`}
          className="block text-center mt-3 text-brand text-sm font-semibold"
        >
          View conversation →
        </Link>
      )}
    </li>
  );
}
