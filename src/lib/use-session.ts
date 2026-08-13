"use client";

import { useCallback, useEffect, useState } from "react";

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

export function useSession() {
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

  return { user, loading, refresh };
}
