"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { CardSkeletonList } from "@/components/Skeleton";
import { ChatBubbleLeftRightIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useSession } from "@/lib/use-session";
import { useTap } from "@/lib/use-tap";

type Booking = {
  id: string;
  status: string;
  agreedAmountKes: number;
  gig: { title: string };
  worker?: { name: string | null };
  transaction?: { status: string } | null;
  messages?: { body: string }[];
};

export default function MessagesPage() {
  const { user } = useSession();
  const [asWorker, setAsWorker] = useState<Booking[]>([]);
  const [asClient, setAsClient] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bookings")
      .then((r) => r.json())
      .then((data) => {
        setAsWorker(data.asWorker ?? []);
        setAsClient(data.asClient ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const isWorker = user?.primaryRole === "WORKER";
  const list = isWorker ? asWorker : asClient;

  return (
    <main className="relative px-6 py-8 max-w-md mx-auto w-full overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-24 w-72 h-72 bg-brand/15 rounded-full blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <h1 className="relative text-2xl font-bold text-white tracking-tight">Messages</h1>
      <p className="relative text-neutral-400 text-sm mt-1 mb-6">
        {isWorker ? "Jobs you're working on" : "Jobs you've posted"}
      </p>

      {loading ? (
        <CardSkeletonList />
      ) : list.length === 0 ? (
        <div className="relative flex flex-col items-center gap-3 py-16">
          <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-neutral-700" strokeWidth={1.5} />
          </span>
          <p className="text-neutral-500 text-sm text-center">Nothing here yet.</p>
        </div>
      ) : (
        <ul className="relative flex flex-col gap-3">
          {list.map((b, i) => (
            <BookingCard key={b.id} booking={b} isWorker={isWorker} delayMs={i * 40} />
          ))}
        </ul>
      )}
    </main>
  );
}

function BookingCard({
  booking,
  isWorker,
  delayMs,
}: {
  booking: Booking;
  isWorker: boolean;
  delayMs: number;
}) {
  const { tapKey, bump } = useTap();
  const latestMessage = booking.messages?.[0]?.body;

  return (
    <li className="animate-card-in" style={{ animationDelay: `${delayMs}ms` }}>
      <Link
        href={`/messages/${booking.id}`}
        onClick={bump}
        className="group flex items-start gap-3 bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-4 shadow-lg shadow-black/30 active:scale-[0.98] transition"
      >
        <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-brand/10 text-brand shrink-0">
          <ChatBubbleLeftRightIcon key={tapKey} className="w-5 h-5 animate-icon-pop" strokeWidth={1.75} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-white">{booking.gig.title}</p>
              {!isWorker && booking.worker && (
                <p className="text-sm text-neutral-400 mt-0.5">with {booking.worker.name ?? "worker"}</p>
              )}
            </div>
            <StatusBadge status={booking.status} />
          </div>
          <p className="text-sm text-neutral-500 mt-2 truncate">
            {latestMessage ?? `No messages yet — status: ${booking.status.toLowerCase()}`}
          </p>
          <div className="flex items-center justify-between mt-3">
            <p className="font-bold text-brand text-sm">KES {booking.agreedAmountKes}</p>
            {booking.transaction && <StatusBadge status={booking.transaction.status} />}
          </div>
        </div>
        <ChevronRightIcon
          className="w-4 h-4 text-neutral-600 shrink-0 mt-1 group-active:translate-x-0.5 transition"
          strokeWidth={2}
        />
      </Link>
    </li>
  );
}
