"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CameraIcon,
  BriefcaseIcon,
  ChevronRightIcon,
  ArrowRightStartOnRectangleIcon,
  BanknotesIcon,
  CheckBadgeIcon,
  ClockIcon,
  StarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  BellAlertIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useSession } from "@/lib/use-session";
import { useTap } from "@/lib/use-tap";
import { pushSupported, subscribeToPush } from "@/lib/push-client";
import StatTile from "@/components/StatTile";
import WhatsAppShareButton from "@/components/WhatsAppShareButton";

type WorkerStats = {
  totalEarnedKes: number;
  completedCount: number;
  activeCount: number;
  ratingAvg: number;
  ratingCount: number;
};
type ClientStats = { totalSpentKes: number; postedCount: number; hiredCount: number; openCount: number };
type Stats = { role: "WORKER"; stats: WorkerStats } | { role: "CLIENT"; stats: ClientStats };

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, refresh } = useSession();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [showCooldownNotice, setShowCooldownNotice] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [pushStatus, setPushStatus] = useState<"unknown" | "unsupported" | NotificationPermission>(
    "unknown"
  );
  const [pushEnabling, setPushEnabling] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const cameraTap = useTap();
  const logoutTap = useTap();
  const pushTap = useTap();

  useEffect(() => {
    if (!user?.id) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount/user change
    setStatsLoading(true);
    fetch("/api/account/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .finally(() => setStatsLoading(false));
  }, [user?.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads a browser-only API, can't know the value during SSR
    setPushStatus(pushSupported() ? Notification.permission : "unsupported");
  }, []);

  async function enablePush() {
    setPushError(null);
    setPushEnabling(true);
    try {
      await subscribeToPush();
      setPushStatus("granted");
    } catch (err) {
      setPushError(err instanceof Error ? err.message : "Could not enable notifications");
      setPushStatus(pushSupported() ? Notification.permission : "unsupported");
    } finally {
      setPushEnabling(false);
    }
  }

  async function savePhone(e: React.FormEvent) {
    e.preventDefault();
    setPhoneError(null);
    setSavingPhone(true);
    try {
      const res = await fetch("/api/account/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save phone number");
      await refresh();
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : "Could not save phone number");
    } finally {
      setSavingPhone(false);
    }
  }

  function startEditingName() {
    if (!user?.canEditName) {
      setShowCooldownNotice(true);
      return;
    }
    setNameInput(user.name ?? "");
    setNameError(null);
    setEditingName(true);
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setNameError(null);
    setSavingName(true);
    try {
      const res = await fetch("/api/account/name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save name");
      await refresh();
      setEditingName(false);
    } catch (err) {
      setNameError(err instanceof Error ? err.message : "Could not save name");
    } finally {
      setSavingName(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await refresh();
    router.push("/");
    router.refresh();
  }

  async function onAvatarSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setAvatarError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/account/avatar", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not upload photo");
      await refresh();
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Could not upload photo");
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <p className="text-center text-neutral-500 text-sm py-16">Loading...</p>;
  if (!user) return <p className="text-center text-neutral-500 text-sm py-16">Not signed in.</p>;

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

      <div className="relative flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="rounded-full p-[2px] bg-gradient-to-br from-brand to-brand-bright">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- user-uploaded photo, no next/image domain config
              <img
                src={user.avatarUrl}
                alt={user.name ?? "Profile photo"}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-black"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-black ring-2 ring-black text-white flex items-center justify-center text-xl font-bold">
                {(user.name ?? "L").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              cameraTap.bump();
              fileInputRef.current?.click();
            }}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-neutral-800 border-2 border-black flex items-center justify-center disabled:opacity-60 active:scale-90 transition"
            aria-label="Change profile photo"
          >
            <CameraIcon key={cameraTap.tapKey} className="w-3.5 h-3.5 text-white animate-icon-pop" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onAvatarSelected}
          />
        </div>
        <div className="flex-1 min-w-0">
          {editingName ? (
            <form onSubmit={saveName} className="flex items-center gap-1.5">
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                autoFocus
                maxLength={80}
                className="min-w-0 flex-1 border border-neutral-700 bg-neutral-900 text-white font-bold text-lg rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <button
                type="submit"
                disabled={savingName}
                className="flex items-center justify-center w-7 h-7 rounded-full bg-brand text-white disabled:opacity-60 active:scale-90 transition shrink-0"
                aria-label="Save name"
              >
                <CheckIcon className="w-4 h-4" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={() => setEditingName(false)}
                className="flex items-center justify-center w-7 h-7 rounded-full bg-neutral-800 text-neutral-300 active:scale-90 transition shrink-0"
                aria-label="Cancel"
              >
                <XMarkIcon className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={startEditingName}
              className="group flex items-center gap-1.5 max-w-full active:opacity-70 transition"
            >
              <p className="font-bold text-lg text-white truncate">{user.name ?? "LinkMeUp user"}</p>
              <PencilIcon
                className="w-3.5 h-3.5 text-neutral-500 shrink-0 group-active:scale-90 transition"
                strokeWidth={2}
              />
            </button>
          )}
          <p className="text-neutral-400 text-sm">{user.phone ?? user.email}</p>
          {uploading && <p className="text-neutral-500 text-xs mt-1">Uploading...</p>}
          {avatarError && <p className="text-red-400 text-xs mt-1">{avatarError}</p>}
          {nameError && <p className="text-red-400 text-xs mt-1">{nameError}</p>}
          {showCooldownNotice && !user.canEditName && (
            <p className="text-neutral-500 text-xs mt-1">
              You can change your name again on {new Date(user.nameEditableAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {!user.phone && (
        <form
          onSubmit={savePhone}
          className="relative mt-6 bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-3 shadow-lg shadow-black/30"
        >
          <div>
            <p className="text-sm font-medium text-white">Add a phone number</p>
            <p className="text-neutral-500 text-xs mt-0.5">
              Needed so we can send M-Pesa payment prompts to your phone.
            </p>
          </div>
          <input
            type="tel"
            inputMode="tel"
            placeholder="07XX XXX XXX"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            required
            className="border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
          {phoneError && <p className="text-red-400 text-xs">{phoneError}</p>}
          <button
            type="submit"
            disabled={savingPhone}
            className="bg-brand text-white font-semibold rounded-xl py-2.5 text-sm disabled:opacity-60 active:scale-[0.98] transition"
          >
            {savingPhone ? "Saving..." : "Save phone number"}
          </button>
        </form>
      )}

      {pushStatus === "default" && (
        <div className="relative mt-6 bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-3 shadow-lg shadow-black/30">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand/10 text-brand shrink-0">
              <BellAlertIcon key={pushTap.tapKey} className="w-5 h-5 animate-icon-pop" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-sm font-medium text-white">Turn on job alerts</p>
              <p className="text-neutral-500 text-xs mt-0.5">
                Get notified instantly about new jobs, messages, and booking updates.
              </p>
            </div>
          </div>
          {pushError && <p className="text-red-400 text-xs">{pushError}</p>}
          <button
            type="button"
            onClick={() => {
              pushTap.bump();
              enablePush();
            }}
            disabled={pushEnabling}
            className="bg-brand text-white font-semibold rounded-xl py-2.5 text-sm disabled:opacity-60 active:scale-[0.98] transition"
          >
            {pushEnabling ? "Enabling..." : "Enable notifications"}
          </button>
        </div>
      )}

      <div className="relative mt-6">
        <p className="text-neutral-500 text-xs font-semibold uppercase tracking-wide mb-3">Your activity</p>
        {statsLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[86px] bg-neutral-900/70 border border-neutral-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : stats?.role === "WORKER" ? (
          <div className="grid grid-cols-2 gap-3">
            <StatTile
              icon={BanknotesIcon}
              label="Total earned"
              value={`KES ${stats.stats.totalEarnedKes.toLocaleString()}`}
            />
            <StatTile icon={CheckBadgeIcon} label="Jobs completed" value={String(stats.stats.completedCount)} />
            <StatTile icon={ClockIcon} label="Active jobs" value={String(stats.stats.activeCount)} />
            <StatTile
              icon={StarIcon}
              label="Rating"
              value={stats.stats.ratingCount ? stats.stats.ratingAvg.toFixed(1) : "New"}
            />
          </div>
        ) : stats?.role === "CLIENT" ? (
          <div className="grid grid-cols-2 gap-3">
            <StatTile
              icon={BanknotesIcon}
              label="Total spent"
              value={`KES ${stats.stats.totalSpentKes.toLocaleString()}`}
            />
            <StatTile icon={DocumentTextIcon} label="Jobs posted" value={String(stats.stats.postedCount)} />
            <StatTile icon={UserGroupIcon} label="Workers hired" value={String(stats.stats.hiredCount)} />
            <StatTile icon={BriefcaseIcon} label="Open jobs" value={String(stats.stats.openCount)} />
          </div>
        ) : null}
      </div>

      {user.primaryRole === "WORKER" && (
        <div className="relative mt-6 flex flex-col gap-3">
          <Link
            href="/onboarding/worker"
            className="group flex items-center gap-3 bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3.5 shadow-lg shadow-black/30 active:scale-[0.98] transition"
          >
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand/10 text-brand shrink-0">
              <BriefcaseIcon className="w-5 h-5" strokeWidth={1.75} />
            </span>
            <span className="text-sm font-medium text-white flex-1">
              {user.workerProfile ? "Edit worker profile" : "Create worker profile"}
            </span>
            <ChevronRightIcon
              className="w-4 h-4 text-neutral-600 shrink-0 group-active:translate-x-0.5 transition"
              strokeWidth={2}
            />
          </Link>
        </div>
      )}

      <div className="relative mt-6 bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-4 shadow-lg shadow-black/30">
        <p className="text-sm font-medium text-white">Know someone who needs this?</p>
        <p className="text-neutral-400 text-xs mt-0.5 mb-3">
          {user.primaryRole === "WORKER"
            ? "Invite them to find paying jobs nearby and get paid instantly via M-Pesa."
            : "Invite them to hire trusted, verified workers nearby via M-Pesa."}
        </p>
        <WhatsAppShareButton
          message={
            user.primaryRole === "WORKER"
              ? "I've been finding paying jobs nearby on LinkMeUp and getting paid instantly via M-Pesa. Check it out:"
              : "I've been hiring trusted workers nearby on LinkMeUp — verified, and I only pay once the job's done. Check it out:"
          }
        />
      </div>

      <button
        onClick={() => {
          logoutTap.bump();
          logout();
        }}
        className="relative mt-8 w-full flex items-center justify-center gap-2 bg-neutral-800 text-neutral-200 font-semibold rounded-xl py-3.5 active:scale-[0.98] transition"
      >
        <ArrowRightStartOnRectangleIcon
          key={logoutTap.tapKey}
          className="w-4 h-4 animate-icon-pop"
          strokeWidth={1.75}
        />
        Log out
      </button>
    </main>
  );
}
