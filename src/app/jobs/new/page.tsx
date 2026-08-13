"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KENYA_COUNTIES } from "@/lib/categories";
import { useSession } from "@/lib/use-session";
import { MapPinIcon, CheckCircleIcon, DocumentPlusIcon } from "@heroicons/react/24/outline";
import { useTap } from "@/lib/use-tap";

export default function NewJobPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [county, setCounty] = useState(KENYA_COUNTIES[0]);
  const [area, setArea] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locStatus, setLocStatus] = useState<"idle" | "loading" | "granted" | "denied">("idle");
  const [budgetKes, setBudgetKes] = useState("");
  const [urgency, setUrgency] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const locTap = useTap();

  useEffect(() => {
    if (!sessionLoading && user && user.primaryRole !== "CLIENT") {
      router.replace("/dashboard");
    }
  }, [sessionLoading, user, router]);

  function captureLocation() {
    locTap.bump();
    setLocStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocStatus("granted");
      },
      () => setLocStatus("denied"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/gigs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          description,
          county,
          area,
          lat: coords?.lat,
          lng: coords?.lng,
          budgetKes: Number(budgetKes),
          urgency,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.push(`/jobs/${data.gig.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (user && user.primaryRole !== "CLIENT") return null;

  return (
    <main className="relative px-6 py-8 max-w-md mx-auto w-full overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-24 w-72 h-72 bg-brand/15 rounded-full blur-3xl"
      />

      <div className="relative flex items-center gap-3">
        <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-brand/10 text-brand shrink-0">
          <DocumentPlusIcon className="w-5 h-5" strokeWidth={1.75} />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Post a job</h1>
          <p className="text-neutral-400 text-sm mt-0.5">Describe it and workers nearby will apply</p>
        </div>
      </div>

      <form
        onSubmit={submit}
        className="relative flex flex-col gap-4 mt-6 bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-4 shadow-lg shadow-black/30"
      >
        <input
          placeholder="Job title, e.g. Paint 2-bedroom house"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-4 py-3 text-base"
        />

        <input
          placeholder="Category, e.g. Plumbing, Electrical, Moving"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          className="border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-4 py-3 text-base"
        />

        <textarea
          placeholder="Describe what you need done..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={4}
          className="border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-4 py-3 text-base"
        />

        <div className="grid grid-cols-2 gap-4">
          <select
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            className="border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-4 py-3 text-base"
          >
            {KENYA_COUNTIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            placeholder="Area / estate"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            required
            className="border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-4 py-3 text-base"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            min={1}
            placeholder="Budget (KES)"
            value={budgetKes}
            onChange={(e) => setBudgetKes(e.target.value)}
            required
            className="border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-4 py-3 text-base"
          />
          <select
            value={urgency}
            onChange={(e) => setUrgency(e.target.value as typeof urgency)}
            className="border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-4 py-3 text-base"
          >
            <option value="LOW">Low urgency</option>
            <option value="MEDIUM">Medium urgency</option>
            <option value="HIGH">Urgent</option>
          </select>
        </div>

        <button
          type="button"
          onClick={captureLocation}
          disabled={locStatus === "loading"}
          className="flex items-center justify-center gap-2 border border-dashed border-neutral-700 text-neutral-300 rounded-xl px-3.5 py-2.5 text-sm disabled:opacity-60 active:scale-[0.98] transition"
        >
          {locStatus === "granted" ? (
            <>
              <CheckCircleIcon key={locTap.tapKey} className="w-4 h-4 text-brand shrink-0 animate-icon-pop" />
              Location captured
            </>
          ) : (
            <>
              <MapPinIcon key={locTap.tapKey} className="w-4 h-4 shrink-0 animate-icon-pop" />
              {locStatus === "loading"
                ? "Getting your location..."
                : locStatus === "denied"
                ? "Couldn't get location — try again"
                : "Use my current location"}
            </>
          )}
        </button>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-brand text-white font-semibold rounded-xl shadow-lg shadow-brand/20 py-3.5 disabled:opacity-60 mt-2 active:scale-[0.98] transition"
        >
          {loading ? "Posting..." : "Post job"}
        </button>
      </form>
    </main>
  );
}
