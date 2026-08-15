"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BanknotesIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";
import BackButton from "@/components/BackButton";
import StatTile from "@/components/StatTile";
import RevenueChart from "@/components/RevenueChart";
import { useSession } from "@/lib/use-session";

type Revenue = {
  totalEarnedKes: number;
  thisWeekKes: number;
  series: { label: string; amountKes: number }[];
};

export default function RevenuePage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [data, setData] = useState<Revenue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionLoading && user && user.primaryRole !== "WORKER") {
      router.replace("/dashboard");
    }
  }, [sessionLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/revenue")
      .then((r) => r.json())
      .then(setData)
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
      <h1 className="relative text-2xl font-bold text-white tracking-tight">Revenue</h1>
      <p className="relative text-neutral-400 text-sm mt-1 mb-5">Track what you're earning over time</p>

      {loading || !data ? (
        <div className="relative flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="h-[86px] bg-neutral-900/70 border border-neutral-800 rounded-2xl animate-pulse" />
            <div className="h-[86px] bg-neutral-900/70 border border-neutral-800 rounded-2xl animate-pulse" />
          </div>
          <div className="h-[220px] bg-neutral-900/70 border border-neutral-800 rounded-2xl animate-pulse" />
        </div>
      ) : (
        <div className="relative flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <StatTile icon={BanknotesIcon} label="Total earned" value={`KES ${data.totalEarnedKes.toLocaleString()}`} />
            <StatTile icon={CalendarDaysIcon} label="This week" value={`KES ${data.thisWeekKes.toLocaleString()}`} />
          </div>
          <RevenueChart series={data.series} />
        </div>
      )}
    </main>
  );
}
