"use client";

import { usePathname } from "next/navigation";
import { useSession } from "@/lib/use-session";

/** Whether the bottom nav / notification bell chrome should be shown for the current route + session. */
export function useShowChrome(): boolean {
  const pathname = usePathname();
  const { user } = useSession();
  return (
    !!user &&
    pathname !== "/" &&
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/signup") &&
    !pathname.startsWith("/messages/")
  );
}
