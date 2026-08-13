"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KENYA_COUNTIES } from "@/lib/categories";
import StarRating from "@/components/StarRating";
import { CardSkeletonList } from "@/components/Skeleton";
import { UsersIcon, CheckBadgeIcon } from "@heroicons/react/24/outline";
import { useSession } from "@/lib/use-session";

type Worker = {
  userId: string;
  category: string;
  county: string;
  area: string;
  dailyRateKes: number | null;
  ratingAvg: number;
  ratingCount: number;
  availability: string;
  verified: boolean;
  distanceKm: number | null;
  user: { id: string; name: string | null; avatarUrl: string | null };
};

const LOCATION_REFRESH_MS = 60000;

function formatDistance(km: number) {
  return km < 1 ? "< 1 km away" : `${km.toFixed(1)} km away`;
}

export default function WorkersPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [categoryInput, setCategoryInput] = useState("");
  const [category, setCategory] = useState("");
  const [county, setCounty] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionLoading && user && user.primaryRole !== "CLIENT") {
      router.replace("/dashboard");
    }
  }, [sessionLoading, user, router]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    function capture() {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationDenied(false);
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
    const res = await fetch(`/api/workers?${params}`);
    const data = await res.json();
    setWorkers(data.workers ?? []);
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

  if (user && user.primaryRole !== "CLIENT") return null;

  return (
    <main className="px-6 py-8 max-w-md mx-auto w-full">
      <h1 className="text-2xl font-bold text-white">Find a worker</h1>
      <p className="text-neutral-400 text-sm mt-1 mb-5">Browse skilled workers near you</p>

      <div className="flex gap-2 mb-5">
        <input
          value={categoryInput}
          onChange={(e) => setCategoryInput(e.target.value)}
          placeholder="Search category..."
          className="flex-1 border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-3 py-2.5 text-sm"
        />
        <select
          value={county}
          onChange={(e) => setCounty(e.target.value)}
          className="flex-1 border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-3 py-2.5 text-sm"
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
        <p className="text-xs text-neutral-500 bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 mb-5">
          Enable location to see workers sorted by distance.
        </p>
      )}

      {loading ? (
        <CardSkeletonList />
      ) : workers.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <UsersIcon className="w-8 h-8 text-neutral-700" strokeWidth={1.5} />
          <p className="text-neutral-500 text-sm text-center">No workers found. Try a different filter.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {workers.map((w) => (
            <li key={w.userId}>
              <Link
                href={`/workers/${w.userId}`}
                className="flex items-start gap-3 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-sm shadow-black/20 active:scale-[0.98] transition"
              >
                <div className="relative shrink-0">
                  {w.user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- user-uploaded photo, no next/image domain config
                    <img
                      src={w.user.avatarUrl}
                      alt={w.user.name ?? "Worker"}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-brand/15 text-brand flex items-center justify-center text-sm font-bold">
                      {(w.user.name ?? "L").charAt(0).toUpperCase()}
                    </div>
                  )}
                  {w.availability === "AVAILABLE" && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-neutral-900" />
                  )}
                </div>
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white flex items-center gap-1">
                      {w.user.name ?? "LinkMeApp user"}
                      {w.verified && (
                        <CheckBadgeIcon
                          className="w-4 h-4 text-sky-400 shrink-0"
                          strokeWidth={1.75}
                          aria-label="Verified"
                        />
                      )}
                    </p>
                    <p className="text-sm text-neutral-400">
                      {w.category} · {w.area}, {w.county}
                      {w.distanceKm != null && ` · ${formatDistance(w.distanceKm)}`}
                    </p>
                    <div className="mt-1.5">
                      <StarRating value={w.ratingAvg} count={w.ratingCount} />
                    </div>
                  </div>
                  {w.dailyRateKes && (
                    <div className="text-right shrink-0 ml-2">
                      <p className="font-bold text-brand text-sm">KES {w.dailyRateKes}</p>
                      <p className="text-xs text-neutral-500">per day</p>
                    </div>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
