"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type CurrentUser = {
  id: string;
  phone: string | null;
  email: string | null;
  name: string | null;
  primaryRole: "WORKER" | "CLIENT";
  avatarUrl: string | null;
  workerProfile: {
    id: string;
    county: string;
    area: string;
    verified: boolean;
    verificationStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  } | null;
} | null;

type SessionContextValue = {
  user: CurrentUser;
  loading: boolean;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Single shared session fetch for the whole app. Without this, every component
 * that calls useSession() would fetch and hold its own copy — mounted once at
 * the root layout (before login), components like BottomNav would then be
 * permanently stuck on a stale "logged out" snapshot until a full page reload.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await fetch("/api/auth/me").then((r) => r.json());
    setUser(data.user);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <SessionContext.Provider value={{ user, loading, refresh }}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}
