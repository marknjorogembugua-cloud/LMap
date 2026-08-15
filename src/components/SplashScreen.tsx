"use client";

import { useEffect, useState } from "react";

const WORDMARK = "linkmeup";
const LETTER_START = 1.75;
const LETTER_STAGGER = 0.09;

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reads matchMedia, only known client-side
      setVisible(false);
      return;
    }

    document.body.style.overflow = "hidden";
    const fadeTimer = setTimeout(() => setFading(true), 3100);
    const removeTimer = setTimeout(() => {
      setVisible(false);
      document.body.style.overflow = "";
    }, 3500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
      document.body.style.overflow = "";
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-400 ease-out ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center">
        <svg width="120" height="120" viewBox="0 0 200 200" className="overflow-visible">
          <g
            style={{ transformOrigin: "100px 100px" }}
            className="animate-[mark-spin-settle_0.6s_ease-in-out_0.75s_both]"
          >
            <circle
              cx="85"
              cy="115"
              r="34"
              fill="#dc2626"
              className="opacity-0 animate-[dot-drop-left_0.7s_cubic-bezier(0.34,1.56,0.64,1)_0.1s_forwards]"
            />
            <circle
              cx="118"
              cy="85"
              r="30"
              fill="#dc2626"
              className="opacity-0 animate-[dot-drop-right_0.7s_cubic-bezier(0.34,1.56,0.64,1)_0.25s_forwards]"
            />
          </g>
        </svg>
        <div className="mt-4 flex text-3xl font-extrabold tracking-tight lowercase text-white">
          {WORDMARK.split("").map((letter, i) => (
            <span
              key={i}
              className="letter-in"
              style={{ animationDelay: `${LETTER_START + i * LETTER_STAGGER}s` }}
            >
              {letter}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
