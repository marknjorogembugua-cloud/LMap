"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CardSkeletonList } from "@/components/Skeleton";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { useSession } from "@/lib/use-session";
import { useTap } from "@/lib/use-tap";

type Person = { name: string | null; avatarUrl: string | null };

type Booking = {
  id: string;
  status: string;
  gig: { title: string; client?: Person };
  worker?: Person;
  messages?: { body: string; createdAt: string }[];
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString();
}

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
        <ul className="relative flex flex-col">
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
  const counterpart = isWorker ? booking.gig.client : booking.worker;
  const name = counterpart?.name ?? (isWorker ? "Client" : "Worker");
  const latest = booking.messages?.[0];

  return (
    <li className="animate-card-in border-b border-neutral-900 last:border-b-0" style={{ animationDelay: `${delayMs}ms` }}>
      <Link
        href={`/messages/${booking.id}`}
        onClick={bump}
        className="flex items-center gap-3 py-3.5 active:opacity-70 transition"
      >
        {counterpart?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- user-uploaded photo, no next/image domain config
          <img
            src={counterpart.avatarUrl}
            alt={name}
            className="w-12 h-12 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand to-brand-bright text-white flex items-center justify-center text-base font-bold shrink-0">
            <span key={tapKey} className="animate-icon-pop">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-semibold text-white truncate">{name}</p>
            {latest && <p className="text-neutral-500 text-xs shrink-0">{timeAgo(latest.createdAt)}</p>}
          </div>
          <p className="text-sm text-neutral-500 truncate mt-0.5">
            {latest ? latest.body : booking.gig.title}
          </p>
        </div>
      </Link>
    </li>
  );
}
