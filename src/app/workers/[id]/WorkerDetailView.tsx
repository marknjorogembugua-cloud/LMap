"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StarRating from "@/components/StarRating";
import ShareButton from "@/components/ShareButton";
import BackButton from "@/components/BackButton";
import { useSession } from "@/lib/use-session";

export type WorkerDetail = {
  userId: string;
  category: string;
  bio: string | null;
  skills: string[];
  county: string;
  area: string;
  dailyRateKes: number | null;
  hourlyRateKes: number | null;
  experienceYears: number | null;
  ratingAvg: number;
  ratingCount: number;
  verified: boolean;
  certifications: {
    id: string;
    title: string;
    institution: string | null;
    year: number | null;
    imageUrl: string | null;
  }[];
  user: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
    reviewsReceived: { id: string; rating: number; comment: string | null; reviewer: { name: string | null } }[];
  };
};

export default function WorkerDetailView({
  initialWorker,
}: {
  id: string;
  initialWorker: WorkerDetail | null;
}) {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [worker] = useState<WorkerDetail | null>(initialWorker);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!sessionLoading && user && user.primaryRole !== "CLIENT") {
      router.replace("/dashboard");
    }
  }, [sessionLoading, user, router]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budgetKes, setBudgetKes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestWorker(e: React.FormEvent) {
    e.preventDefault();
    if (!worker) return;
    setError(null);
    setSubmitting(true);
    try {
      const gigRes = await fetch("/api/gigs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category: worker.category,
          description,
          county: worker.county,
          area: worker.area,
          budgetKes: Number(budgetKes),
          targetWorkerId: worker.userId,
        }),
      });
      const gigData = await gigRes.json();
      if (!gigRes.ok) throw new Error(gigData.error ?? "Could not create request");

      const bookingRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gigId: gigData.gig.id,
          workerId: worker.userId,
          agreedAmountKes: Number(budgetKes),
        }),
      });
      const bookingData = await bookingRes.json();
      if (!bookingRes.ok) throw new Error(bookingData.error ?? "Could not send request");

      router.push(`/messages/${bookingData.booking.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (!worker) return <p className="text-center text-neutral-500 text-sm py-16">Worker not found.</p>;
  if (user && user.primaryRole !== "CLIENT") return null;

  return (
    <main className="px-6 py-8 max-w-md mx-auto w-full">
      <div className="flex items-center justify-between mb-3">
        <BackButton fallbackHref="/workers" className="" />
        <ShareButton
          title={worker.user.name ?? "LinkMeApp worker"}
          text={`${worker.user.name ?? "This worker"} · ${worker.category} on LinkMeApp`}
        />
      </div>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {worker.user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- user-uploaded photo, no next/image domain config
            <img
              src={worker.user.avatarUrl}
              alt={worker.user.name ?? "Worker"}
              className="w-14 h-14 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-brand text-white flex items-center justify-center text-xl font-bold shrink-0">
              {(worker.user.name ?? "L").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">{worker.user.name ?? "LinkMeApp user"}</h1>
            <p className="text-neutral-400 text-sm mt-1">
              {worker.category} · {worker.area}, {worker.county}
            </p>
            <div className="mt-2">
              <StarRating value={worker.ratingAvg} count={worker.ratingCount} />
            </div>
          </div>
        </div>
        {worker.verified && (
          <span className="bg-sky-500/15 text-sky-400 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0">
            ✓ Verified
          </span>
        )}
      </div>

      {worker.bio && <p className="mt-4 text-sm text-neutral-200">{worker.bio}</p>}

      {worker.skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {worker.skills.map((s) => (
            <span key={s} className="bg-neutral-800 text-neutral-200 text-xs px-2.5 py-1 rounded-full">
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mt-5">
        {worker.dailyRateKes && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
            <p className="text-xs text-neutral-500">Daily rate</p>
            <p className="font-bold text-brand">KES {worker.dailyRateKes}</p>
          </div>
        )}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
          <p className="text-xs text-neutral-500">Experience</p>
          <p className="font-bold text-white">{worker.experienceYears ?? 0} yrs</p>
        </div>
      </div>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="mt-6 w-full bg-brand text-white font-semibold rounded-xl shadow-lg shadow-brand/20 py-3.5"
        >
          Request this worker
        </button>
      ) : (
        <form onSubmit={requestWorker} className="mt-6 flex flex-col gap-3 bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
          <p className="font-semibold text-sm text-white">Describe the job</p>
          <input
            placeholder="Job title, e.g. Fix kitchen sink leak"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-3.5 py-2.5 text-sm"
          />
          <textarea
            placeholder="Describe what you need done..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={3}
            className="border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-3.5 py-2.5 text-sm"
          />
          <input
            type="number"
            min={1}
            placeholder="Budget (KES)"
            value={budgetKes}
            onChange={(e) => setBudgetKes(e.target.value)}
            required
            className="border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-3.5 py-2.5 text-sm"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="bg-brand text-white font-semibold rounded-xl shadow-lg shadow-brand/20 py-3 disabled:opacity-60"
          >
            {submitting ? "Sending..." : "Send request"}
          </button>
        </form>
      )}

      {worker.certifications.length > 0 && (
        <div className="mt-8">
          <h2 className="font-semibold text-white mb-3">Courses & Certifications</h2>
          <ul className="flex flex-col gap-2">
            {worker.certifications.map((c) => (
              <li key={c.id} className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-xl p-3">
                {c.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- user-uploaded photo, no next/image domain config
                  <img
                    src={c.imageUrl}
                    alt={c.title}
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{c.title}</p>
                  {(c.institution || c.year) && (
                    <p className="text-xs text-neutral-500 mt-0.5 truncate">
                      {[c.institution, c.year].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {worker.user.reviewsReceived.length > 0 && (
        <div className="mt-8">
          <h2 className="font-semibold text-white mb-3">Reviews</h2>
          <ul className="flex flex-col gap-3">
            {worker.user.reviewsReceived.map((r) => (
              <li key={r.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{r.reviewer.name ?? "Client"}</p>
                  <StarRating value={r.rating} />
                </div>
                {r.comment && <p className="text-sm text-neutral-300 mt-1">{r.comment}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
