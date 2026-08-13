"use client";

import { useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";

const HREF = "/login?role=WORKER";
const ANIMATION_MS = 420;

export default function FindWorkButton() {
  const router = useRouter();
  const [opening, setOpening] = useState(false);

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    if (opening) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push(HREF);
      return;
    }

    setOpening(true);
    setTimeout(() => router.push(HREF), ANIMATION_MS);
  }

  return (
    <a
      href={HREF}
      onClick={handleClick}
      className="flex items-center justify-center gap-2.5 bg-brand text-white font-bold rounded-full py-3.5 shadow-lg shadow-brand/20 active:scale-[0.98] transition"
    >
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0 overflow-visible">
        <rect
          x="3.75"
          y="11.25"
          width="16.5"
          height="8.25"
          rx="2"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="12" cy="12" r="0.5" fill="currentColor" />
        <g
          className={opening ? "animate-[briefcase-papers-in_0.25s_ease-out_0.15s_both]" : "opacity-0"}
        >
          <line
            x1="8"
            y1="14.5"
            x2="16"
            y2="14.5"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
          />
          <line
            x1="8"
            y1="16.5"
            x2="14"
            y2="16.5"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </g>
        <g
          style={{ transformOrigin: "12px 12px" }}
          className={
            opening
              ? "animate-[briefcase-lid-open_0.4s_cubic-bezier(0.34,1.56,0.64,1)_forwards]"
              : ""
          }
        >
          <path
            d="M9 6.75V5.25A2.25 2.25 0 0 1 11.25 3h1.5A2.25 2.25 0 0 1 15 5.25v1.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect
            x="3.75"
            y="6.75"
            width="16.5"
            height="5.25"
            rx="2"
            stroke="currentColor"
            strokeWidth="2"
          />
        </g>
      </svg>
      I want to find work
    </a>
  );
}
