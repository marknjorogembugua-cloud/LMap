"use client";

import type { ReactNode } from "react";
import { useShowChrome } from "@/lib/use-chrome";

/** Reserves bottom space for BottomNav only on routes where it's actually shown. */
export default function PageShell({ children }: { children: ReactNode }) {
  const showChrome = useShowChrome();

  return (
    <div className={`flex-1 ${showChrome ? "pb-[calc(4rem+env(safe-area-inset-bottom))]" : ""}`}>
      {children}
    </div>
  );
}
