"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserGroupIcon, BriefcaseIcon } from "@heroicons/react/24/outline";
import BackButton from "@/components/BackButton";
import { CardSkeletonList } from "@/components/Skeleton";
import { useSession } from "@/lib/use-session";
import { useTap } from "@/lib/use-tap";

type Contact = {
  client: { id: string; name: string | null; avatarUrl: string | null };
  jobsCount: number;
  totalEarnedKes: number;
  lastBookingId: string;
  lastJobTitle: string;
  lastWorkedAt: string | null;
};

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days < 1) return "today";
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NetworkPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [network, setNetwork] = useState<Contact[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionLoading && user && user.primaryRole !== "WORKER") {
      router.replace("/dashboard");
    }
  }, [sessionLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/network")
      .then((r) => r.json())
      .then((data) => setNetwork(data.network ?? []))
      .finally(() => setLoading(false));
  }, [user]);

  if (user && user.primaryRole !== "WORKER") return null;

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

      <BackButton fallbackHref="/dashboard" />
      <h1 className="relative text-2xl font-bold text-white tracking-tight">Your network</h1>
      <p className="relative text-neutral-400 text-sm mt-1 mb-5">Clients you've worked with before</p>

      {loading ? (
        <CardSkeletonList />
      ) : !network || network.length === 0 ? (
        <div className="relative flex flex-col items-center gap-3 py-16">
          <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800">
            <UserGroupIcon className="w-6 h-6 text-neutral-700" strokeWidth={1.5} />
          </span>
          <p className="text-neutral-500 text-sm text-center">
            Complete your first job to start building your network.
          </p>
        </div>
      ) : (
        <ul className="relative flex flex-col gap-3">
          {network.map((c, i) => (
            <ContactCard key={c.client.id} contact={c} delayMs={i * 40} />
          ))}
        </ul>
      )}
    </main>
  );
}

function ContactCard({ contact, delayMs }: { contact: Contact; delayMs: number }) {
  const { tapKey, bump } = useTap();
  const { client, jobsCount, totalEarnedKes, lastBookingId, lastJobTitle, lastWorkedAt } = contact;
  return (
    <li className="animate-card-in" style={{ animationDelay: `${delayMs}ms` }}>
      <Link
        href={`/messages/${lastBookingId}`}
        onClick={bump}
        className="group flex items-start gap-3 bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-4 shadow-lg shadow-black/30 active:scale-[0.98] transition"
      >
        {client.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- user-uploaded photo, no next/image domain config
          <img
            src={client.avatarUrl}
            alt={client.name ?? "Client"}
            className="w-11 h-11 rounded-full object-cover shrink-0 ring-2 ring-neutral-800"
          />
        ) : (
          <span
            key={tapKey}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-brand/10 text-brand font-bold shrink-0 animate-icon-pop"
          >
            {(client.name ?? "C").charAt(0).toUpperCase()}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-white">{client.name ?? "Client"}</p>
            <span className="text-xs text-neutral-500 shrink-0">{timeAgo(lastWorkedAt)}</span>
          </div>
          <p className="text-sm text-neutral-400 mt-0.5 flex items-center gap-1">
            <BriefcaseIcon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
            <span className="truncate">{lastJobTitle}</span>
          </p>
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-neutral-500">
              {jobsCount} {jobsCount === 1 ? "job" : "jobs"} together
            </p>
            <p className="font-bold text-brand text-sm">KES {totalEarnedKes.toLocaleString()}</p>
          </div>
        </div>
      </Link>
    </li>
  );
}
