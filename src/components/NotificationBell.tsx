"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { BellIcon } from "@heroicons/react/24/outline";
import { useSession } from "@/lib/use-session";
import { useShowChrome } from "@/lib/use-chrome";
import { useTap } from "@/lib/use-tap";

const POLL_MS = 20000;

export default function NotificationBell() {
  const { user } = useSession();
  const showChrome = useShowChrome();
  const [count, setCount] = useState(0);
  const { tapKey, bump } = useTap();

  const loadCount = useCallback(async () => {
    const res = await fetch("/api/notifications/unread-count");
    if (!res.ok) return;
    const data = await res.json();
    setCount(data.count ?? 0);
  }, []);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount
    loadCount();
    const interval = setInterval(loadCount, POLL_MS);
    return () => clearInterval(interval);
  }, [user, loadCount]);

  if (!showChrome || !user) return null;

  return (
    <Link
      href="/notifications"
      onClick={bump}
      aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
      className="fixed top-[calc(0.75rem+env(safe-area-inset-top))] right-3 z-40 flex items-center justify-center w-10 h-10 rounded-full bg-neutral-900/90 backdrop-blur-md border border-neutral-800 text-neutral-300 active:scale-[0.96] transition"
    >
      <BellIcon key={tapKey} className="w-5 h-5 animate-icon-pop" strokeWidth={1.75} />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-brand text-white text-[10px] font-bold leading-none animate-badge-pop">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
