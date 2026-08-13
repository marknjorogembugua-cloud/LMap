"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KENYA_COUNTIES, guessCategoryIcon } from "@/lib/categories";
import StatusBadge from "@/components/StatusBadge";
import { CardSkeletonList } from "@/components/Skeleton";
import { BriefcaseIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { useSession } from "@/lib/use-session";
import { useTap } from "@/lib/use-tap";

type Job = {
  id: string;
  title: string;
  category: string;
  county: string;
  area: string;
  budgetKes: number;
  urgency: string;
  status: string;
  distanceKm: number | null;
  client: { name: string | null };
};

const LOCATION_REFRESH_MS = 60000;

function formatDistance(km: number) {
  return km < 1 ? "< 1 km away" : `${km.toFixed(1)} km away`;
}

export default function JobsPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [categoryInput, setCategoryInput] = useState("");
  const [category, setCategory] = useState("");
  const [county, setCounty] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const didPrefillCounty = useRef(false);

  useEffect(() => {
    if (!sessionLoading && user && user.primaryRole !== "WORKER") {
      router.replace("/dashboard");
    }
  }, [sessionLoading, user, router]);

  useEffect(() => {
    if (!didPrefillCounty.current && user?.workerProfile?.county) {
      didPrefillCounty.current = true;
      setCounty(user.workerProfile.county);
    }
  }, [user]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    function capture() {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCoords(next);
          setLocationDenied(false);
          fetch("/api/profile/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(next),
          }).catch(() => {});
        },
        () => setLocationDenied(true),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
    capture();
    const interval = setInterval(capture, LOCATION_REFRESH_MS);
    return () => clearInterval(interval);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (county) params.set("county", county);
    if (coords) {
      params.set("lat", String(coords.lat));
      params.set("lng", String(coords.lng));
    }
    const res = await fetch(`/api/gigs?${params}`);
    const data = await res.json();
    setJobs(data.gigs ?? []);
    setLoading(false);
  }, [category, county, coords]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount/filter change
    load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => setCategory(categoryInput), 300);
    return () => clearTimeout(t);
  }, [categoryInput]);

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

      <h1 className="relative text-2xl font-bold text-white tracking-tight">Open jobs</h1>
      <p className="relative text-neutral-400 text-sm mt-1 mb-5">Jobs looking for skilled hands near you</p>

      <div className="relative flex gap-2 mb-5">
        <input
          value={categoryInput}
          onChange={(e) => setCategoryInput(e.target.value)}
          placeholder="Search category..."
          className="flex-1 border border-neutral-800 bg-neutral-900/70 text-white placeholder:text-neutral-500 rounded-xl px-3 py-2.5 text-sm shadow-sm shadow-black/20"
        />
        <select
          value={county}
          onChange={(e) => setCounty(e.target.value)}
          className="flex-1 border border-neutral-800 bg-neutral-900/70 text-white placeholder:text-neutral-500 rounded-xl px-3 py-2.5 text-sm shadow-sm shadow-black/20"
        >
          <option value="">All counties</option>
          {KENYA_COUNTIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {locationDenied && !coords && (
        <p className="relative flex items-center gap-2 text-xs text-neutral-500 bg-neutral-900/70 border border-neutral-800 rounded-xl px-3.5 py-2.5 mb-5">
          <MapPinIcon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
          Enable location to see jobs sorted by distance.
        </p>
      )}

      {loading ? (
        <CardSkeletonList />
      ) : jobs.length === 0 ? (
        <div className="relative flex flex-col items-center gap-3 py-16">
          <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800">
            <BriefcaseIcon className="w-6 h-6 text-neutral-700" strokeWidth={1.5} />
          </span>
          <p className="text-neutral-500 text-sm text-center">No open jobs. Check back soon.</p>
        </div>
      ) : (
        <ul className="relative flex flex-col gap-3">
          {jobs.map((j, i) => (
            <JobCard key={j.id} job={j} delayMs={i * 40} />
          ))}
        </ul>
      )}
    </main>
  );
}

function JobCard({ job, delayMs }: { job: Job; delayMs: number }) {
  const { tapKey, bump } = useTap();
  const Icon = guessCategoryIcon(job.category);
  return (
    <li className="animate-card-in" style={{ animationDelay: `${delayMs}ms` }}>
      <Link
        href={`/jobs/${job.id}`}
        onClick={bump}
        className="group flex items-start gap-3 bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-4 shadow-lg shadow-black/30 active:scale-[0.98] transition"
      >
        <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-brand/10 text-brand shrink-0">
          {/* eslint-disable-next-line react-hooks/static-components -- guessCategoryIcon only ever returns one of a fixed set of stable heroicon components */}
          <Icon key={tapKey} className="w-5 h-5 animate-icon-pop" strokeWidth={1.75} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-white">{job.title}</p>
            <StatusBadge status={job.urgency} />
          </div>
          <p className="text-sm text-neutral-400 mt-0.5">
            {job.category} · {job.area}, {job.county}
            {job.distanceKm != null && ` · ${formatDistance(job.distanceKm)}`}
          </p>
          <div className="flex items-center justify-between mt-3">
            <p className="font-bold text-brand text-sm">KES {job.budgetKes}</p>
            <p className="text-xs text-neutral-500">by {job.client.name ?? "Client"}</p>
          </div>
        </div>
      </Link>
    </li>
  );
}
