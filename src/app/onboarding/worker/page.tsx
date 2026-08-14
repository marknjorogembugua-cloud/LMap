"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  XMarkIcon,
  PhotoIcon,
  MapPinIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { KENYA_COUNTIES } from "@/lib/categories";
import { useSession } from "@/lib/use-session";
import BackButton from "@/components/BackButton";

type Certification = {
  id: string;
  title: string;
  institution: string | null;
  year: number | null;
  imageUrl: string | null;
};

export default function WorkerOnboardingPage() {
  const router = useRouter();
  const { user, loading: sessionLoading, refresh } = useSession();
  const isEditing = !!user?.workerProfile;

  // Step 1: the only fields a WorkerProfile actually requires.
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [category, setCategory] = useState("");
  const [county, setCounty] = useState(KENYA_COUNTIES[0]);
  const [area, setArea] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locStatus, setLocStatus] = useState<"idle" | "loading" | "granted" | "denied">("idle");

  // Step 2 / edit-mode extras — all optional.
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [dailyRateKes, setDailyRateKes] = useState("");
  const [experienceYears, setExperienceYears] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [certTitle, setCertTitle] = useState("");
  const [certInstitution, setCertInstitution] = useState("");
  const [certYear, setCertYear] = useState("");
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certError, setCertError] = useState<string | null>(null);
  const [certBusy, setCertBusy] = useState(false);
  const certFileInputRef = useRef<HTMLInputElement | null>(null);

  const [verifyFile, setVerifyFile] = useState<File | null>(null);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const verifyFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!sessionLoading && user && user.primaryRole !== "WORKER") {
      router.replace("/dashboard");
    }
  }, [sessionLoading, user, router]);

  const loadCertifications = useCallback(async () => {
    const res = await fetch("/api/profile/certifications");
    const data = await res.json();
    setCertifications(data.certifications ?? []);
  }, []);

  useEffect(() => {
    if (isEditing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount
      loadCertifications();
    }
  }, [isEditing, loadCertifications]);

  async function addCertification(e: React.FormEvent) {
    e.preventDefault();
    setCertError(null);
    setCertBusy(true);
    try {
      const formData = new FormData();
      formData.append("title", certTitle);
      if (certInstitution) formData.append("institution", certInstitution);
      if (certYear) formData.append("year", certYear);
      if (certFile) formData.append("file", certFile);

      const res = await fetch("/api/profile/certifications", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not add certification");
      setCertifications((prev) => [data.certification, ...prev]);
      setCertTitle("");
      setCertInstitution("");
      setCertYear("");
      setCertFile(null);
      if (certFileInputRef.current) certFileInputRef.current.value = "";
    } catch (err) {
      setCertError(err instanceof Error ? err.message : "Could not add certification");
    } finally {
      setCertBusy(false);
    }
  }

  function captureLocation() {
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

  async function removeCertification(id: string) {
    setCertBusy(true);
    try {
      const res = await fetch(`/api/profile/certifications/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not remove certification");
      setCertifications((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setCertError(err instanceof Error ? err.message : "Could not remove certification");
    } finally {
      setCertBusy(false);
    }
  }

  async function submitVerification(e: React.FormEvent) {
    e.preventDefault();
    if (!verifyFile) return;
    setVerifyError(null);
    setVerifyBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", verifyFile);
      const res = await fetch("/api/profile/verification", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not submit for verification");
      setVerifyFile(null);
      if (verifyFileInputRef.current) verifyFileInputRef.current.value = "";
      await refresh();
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : "Could not submit for verification");
    } finally {
      setVerifyBusy(false);
    }
  }

  function skillsList() {
    return skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function saveProfile(extra: Record<string, unknown> = {}) {
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category,
        county,
        area,
        lat: coords?.lat,
        lng: coords?.lng,
        ...extra,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Something went wrong");
  }

  // Step 1 "Continue": create the profile with just the required basics,
  // so it exists even if the user drops off before step 2.
  async function submitBasics(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await saveProfile();
      setWizardStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function finishWithExtras(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await saveProfile({
        bio: bio || undefined,
        skills: skillsList(),
        dailyRateKes: dailyRateKes ? Number(dailyRateKes) : undefined,
        experienceYears: experienceYears ? Number(experienceYears) : undefined,
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await saveProfile({
        bio: bio || undefined,
        skills: skillsList(),
        dailyRateKes: dailyRateKes ? Number(dailyRateKes) : undefined,
        experienceYears: experienceYears ? Number(experienceYears) : undefined,
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const locationButton = (
    <button
      type="button"
      onClick={captureLocation}
      disabled={locStatus === "loading"}
      className="flex items-center justify-center gap-2 border border-dashed border-neutral-700 text-neutral-300 rounded-xl px-3.5 py-2.5 text-sm disabled:opacity-60"
    >
      {locStatus === "granted" ? (
        <>
          <CheckCircleIcon className="w-4 h-4 text-brand shrink-0" />
          Location captured
        </>
      ) : (
        <>
          <MapPinIcon className="w-4 h-4 shrink-0" />
          {locStatus === "loading"
            ? "Getting your location..."
            : locStatus === "denied"
            ? "Couldn't get location — try again"
            : "Use my current location (optional)"}
        </>
      )}
    </button>
  );

  const certificationsSection = (
    <div className="mt-8">
      <h2 className="text-lg font-bold text-white">Courses & certifications</h2>
      <p className="text-neutral-400 text-sm mt-1 mb-4">
        Add courses or training you&apos;ve completed to stand out to clients.
      </p>

      {certifications.length > 0 && (
        <ul className="flex flex-col gap-2 mb-4">
          {certifications.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                {c.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- user-uploaded photo, no next/image domain config
                  <img
                    src={c.imageUrl}
                    alt={c.title}
                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0">
                    <PhotoIcon className="w-4 h-4 text-neutral-600" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{c.title}</p>
                  {(c.institution || c.year) && (
                    <p className="text-xs text-neutral-500 mt-0.5 truncate">
                      {[c.institution, c.year].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                disabled={certBusy}
                onClick={() => removeCertification(c.id)}
                className="text-neutral-500 hover:text-red-400 shrink-0"
                aria-label={`Remove ${c.title}`}
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={addCertification} className="flex flex-col gap-3 bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
        <input
          value={certTitle}
          onChange={(e) => setCertTitle(e.target.value)}
          required
          placeholder="Course or certification title"
          className="border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-3.5 py-2.5 text-sm"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            value={certInstitution}
            onChange={(e) => setCertInstitution(e.target.value)}
            placeholder="Institution (optional)"
            className="border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-3.5 py-2.5 text-sm"
          />
          <input
            type="number"
            value={certYear}
            onChange={(e) => setCertYear(e.target.value)}
            placeholder="Year (optional)"
            className="border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-3.5 py-2.5 text-sm"
          />
        </div>

        <button
          type="button"
          onClick={() => certFileInputRef.current?.click()}
          className="flex items-center gap-2 border border-dashed border-neutral-700 text-neutral-400 rounded-xl px-3.5 py-2.5 text-sm"
        >
          <PhotoIcon className="w-4 h-4 shrink-0" />
          <span className="truncate">{certFile ? certFile.name : "Attach certificate image (optional)"}</span>
        </button>
        <input
          ref={certFileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => setCertFile(e.target.files?.[0] ?? null)}
        />

        {certError && <p className="text-red-400 text-sm">{certError}</p>}
        <button
          type="submit"
          disabled={certBusy}
          className="bg-neutral-800 text-white font-semibold rounded-xl py-2.5 disabled:opacity-60"
        >
          {certBusy ? "Saving..." : "Add"}
        </button>
      </form>
    </div>
  );

  const verificationStatus = user?.workerProfile?.verificationStatus ?? "NONE";

  const verificationSection = (
    <div className="mt-8 bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand/10 text-brand shrink-0">
          <ShieldCheckIcon className="w-5 h-5" strokeWidth={1.75} />
        </span>
        <div>
          <p className="text-sm font-medium text-white">Get verified</p>
          <p className="text-neutral-500 text-xs mt-0.5">A verified badge helps clients trust you faster.</p>
        </div>
      </div>

      {verificationStatus === "APPROVED" ? (
        <p className="text-brand text-sm mt-3 flex items-center gap-1.5">
          <CheckCircleIcon className="w-4 h-4 shrink-0" strokeWidth={2} />
          You&apos;re verified
        </p>
      ) : verificationStatus === "PENDING" ? (
        <p className="text-amber-400 text-sm mt-3">Submitted — awaiting review.</p>
      ) : (
        <form onSubmit={submitVerification} className="flex flex-col gap-3 mt-3">
          {verificationStatus === "REJECTED" && (
            <p className="text-red-400 text-xs">
              Your last submission wasn&apos;t approved. You can try again with a clearer photo.
            </p>
          )}
          <button
            type="button"
            onClick={() => verifyFileInputRef.current?.click()}
            className="flex items-center gap-2 border border-dashed border-neutral-700 text-neutral-400 rounded-xl px-3.5 py-2.5 text-sm"
          >
            <PhotoIcon className="w-4 h-4 shrink-0" />
            <span className="truncate">
              {verifyFile ? verifyFile.name : "Attach a photo of your national ID"}
            </span>
          </button>
          <input
            ref={verifyFileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => setVerifyFile(e.target.files?.[0] ?? null)}
          />
          {verifyError && <p className="text-red-400 text-sm">{verifyError}</p>}
          <button
            type="submit"
            disabled={verifyBusy || !verifyFile}
            className="bg-brand text-white font-semibold rounded-xl py-2.5 text-sm disabled:opacity-60"
          >
            {verifyBusy ? "Submitting..." : "Submit for verification"}
          </button>
        </form>
      )}
    </div>
  );

  if (user && user.primaryRole !== "WORKER") return null;

  // Existing worker editing their profile later: show everything on one page.
  if (isEditing) {
    return (
      <main className="px-6 py-8 max-w-md mx-auto w-full">
        <BackButton fallbackHref="/account" />
        <h1 className="text-2xl font-bold text-white">Edit your profile</h1>
        <p className="text-neutral-400 text-sm mt-1 mb-6">This is how clients find and trust you.</p>

        <form onSubmit={submitEdit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-neutral-200">What do you do?</span>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              placeholder="e.g. Plumber, House painter, Boda boda rider"
              className="border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-4 py-3 text-base"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-neutral-200">Short bio</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="e.g. 8 years fixing plumbing across Nairobi. Fast, reliable, fair prices."
              className="border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-4 py-3 text-base"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-neutral-200">Skills (comma separated)</span>
            <input
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="pipe fitting, leak repair, tank installation"
              className="border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-4 py-3 text-base"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-neutral-200">County</span>
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
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-neutral-200">Area / estate</span>
              <input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                required
                placeholder="e.g. Kasarani"
                className="border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-4 py-3 text-base"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-neutral-200">Daily rate (KES)</span>
              <input
                type="number"
                min={0}
                value={dailyRateKes}
                onChange={(e) => setDailyRateKes(e.target.value)}
                placeholder="1500"
                className="border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-4 py-3 text-base"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-neutral-200">Years of experience</span>
              <input
                type="number"
                min={0}
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                placeholder="5"
                className="border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-4 py-3 text-base"
              />
            </label>
          </div>

          {locationButton}

          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-brand text-white font-semibold rounded-xl shadow-lg shadow-brand/20 py-3.5 disabled:opacity-60 mt-2"
          >
            {loading ? "Saving..." : "Save changes"}
          </button>
        </form>

        {certificationsSection}
        {verificationSection}
      </main>
    );
  }

  // First-time signup: a short two-step wizard. Step 1 is the only thing
  // actually required; step 2 is skippable and everything in it is optional.
  return (
    <main className="px-6 py-8 max-w-md mx-auto w-full">
      <div className="flex items-center gap-2 mb-6">
        <div className={`h-1.5 flex-1 rounded-full ${wizardStep >= 1 ? "bg-brand" : "bg-neutral-800"}`} />
        <div className={`h-1.5 flex-1 rounded-full ${wizardStep >= 2 ? "bg-brand" : "bg-neutral-800"}`} />
      </div>

      {wizardStep === 1 ? (
        <>
          <h1 className="text-2xl font-bold text-white">What do you do, and where?</h1>
          <p className="text-neutral-400 text-sm mt-1 mb-6">Step 1 of 2 — this is all you need to get started.</p>

          <form onSubmit={submitBasics} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-neutral-200">What do you do?</span>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                placeholder="e.g. Plumber, House painter, Boda boda rider"
                className="border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-4 py-3 text-base"
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-neutral-200">County</span>
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
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-neutral-200">Area / estate</span>
                <input
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  required
                  placeholder="e.g. Kasarani"
                  className="border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-4 py-3 text-base"
                />
              </label>
            </div>

            {locationButton}

            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="bg-brand text-white font-semibold rounded-xl shadow-lg shadow-brand/20 py-3.5 disabled:opacity-60 mt-2"
            >
              {loading ? "Saving..." : "Continue"}
            </button>
          </form>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-white">Add a few more details</h1>
          <p className="text-neutral-400 text-sm mt-1 mb-6">
            Step 2 of 2 — totally optional. You can always fill these in later from your profile.
          </p>

          <form onSubmit={finishWithExtras} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-neutral-200">Short bio</span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="e.g. 8 years fixing plumbing across Nairobi. Fast, reliable, fair prices."
                className="border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-4 py-3 text-base"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-neutral-200">Skills (comma separated)</span>
              <input
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="pipe fitting, leak repair, tank installation"
                className="border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-4 py-3 text-base"
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-neutral-200">Daily rate (KES)</span>
                <input
                  type="number"
                  min={0}
                  value={dailyRateKes}
                  onChange={(e) => setDailyRateKes(e.target.value)}
                  placeholder="1500"
                  className="border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-4 py-3 text-base"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-neutral-200">Years of experience</span>
                <input
                  type="number"
                  min={0}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  placeholder="5"
                  className="border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-4 py-3 text-base"
                />
              </label>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="bg-brand text-white font-semibold rounded-xl shadow-lg shadow-brand/20 py-3.5 disabled:opacity-60 mt-2"
            >
              {loading ? "Saving..." : "Save & finish"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="text-neutral-400 text-sm font-medium"
            >
              Skip for now
            </button>
          </form>
        </>
      )}
    </main>
  );
}
