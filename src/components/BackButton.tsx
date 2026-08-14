"use client";

import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

/** Consistent back affordance for pages reached by drilling in, not part of the bottom tab bar. */
export default function BackButton({
  fallbackHref,
  className = "mb-3",
}: {
  fallbackHref?: string;
  /** Spacing/positioning override — defaults to a bottom margin for stacking above a page header. */
  className?: string;
}) {
  const router = useRouter();

  function goBack() {
    if (fallbackHref && window.history.length <= 2) {
      router.push(fallbackHref);
    } else {
      router.back();
    }
  }

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label="Go back"
      className={`flex items-center justify-center w-9 h-9 -ml-1.5 rounded-full text-neutral-300 active:bg-neutral-800 active:scale-[0.94] transition ${className}`}
    >
      <ChevronLeftIcon className="w-6 h-6" strokeWidth={2.25} />
    </button>
  );
}
