"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BriefcaseIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayCircleIcon,
  ChatBubbleLeftRightIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType, SVGProps } from "react";

const POLL_MS = 5000;

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  entityUrl: string;
  read: boolean;
  createdAt: string;
};

const TYPE_ICONS: Record<string, HeroIcon> = {
  GIG_NEARBY: BriefcaseIcon,
  APPLICATION_RECEIVED: BriefcaseIcon,
  APPLICATION_ACCEPTED: CheckCircleIcon,
  APPLICATION_DECLINED: XCircleIcon,
  BOOKING_STARTED: PlayCircleIcon,
  BOOKING_COMPLETED: CheckCircleIcon,
  NEW_MESSAGE: ChatBubbleLeftRightIcon,
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/notifications");
    const data = await res.json();
    setNotifications(data.notifications ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, [load]);

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    load();
  }

  async function openNotification(n: Notification) {
    if (!n.read) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      await fetch(`/api/notifications/${n.id}/read`, { method: "POST" });
    }
    router.push(n.entityUrl);
  }

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <main className="px-6 py-8 max-w-md mx-auto w-full">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-neutral-400 text-sm mt-1">Stay on top of your jobs</p>
        </div>
        {hasUnread && (
          <button
            type="button"
            onClick={markAllRead}
            className="text-brand text-sm font-medium shrink-0 mt-1"
          >
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-neutral-500 text-sm text-center py-10">Loading...</p>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <BellIcon className="w-8 h-8 text-neutral-700" strokeWidth={1.5} />
          <p className="text-neutral-500 text-sm text-center">No notifications yet.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3 mt-6">
          {notifications.map((n) => {
            const Icon = TYPE_ICONS[n.type] ?? BellIcon;
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => openNotification(n)}
                  className={`w-full text-left flex items-start gap-3 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 active:scale-[0.98] transition ${
                    n.read ? "opacity-70" : "border-l-2 border-l-brand"
                  }`}
                >
                  <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand/10 text-brand shrink-0">
                    <Icon className="w-4 h-4" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white text-sm">{n.title}</p>
                    <p className="text-neutral-400 text-sm mt-0.5 truncate">{n.body}</p>
                    <p className="text-neutral-600 text-xs mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
