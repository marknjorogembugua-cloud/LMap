"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "linkmeup_nav_tour_v1";
const FIND_TIMEOUT_MS = 1500;
const FIND_POLL_MS = 50;
const TOOLTIP_WIDTH = 280;
const GAP = 14;
const PAD = 8;

type Step = { target: string; title: string; body: string };

const WORKER_STEPS: Step[] = [
  {
    target: "card-jobs",
    title: "Find work near you",
    body: "Browse open jobs that match your skills, sorted by distance so you always see what's closest first.",
  },
  {
    target: "card-network",
    title: "Build your network",
    body: "Every completed job adds the client to My Network — see who you've worked with and reconnect anytime.",
  },
  {
    target: "card-revenue",
    title: "Track your earnings",
    body: "Payouts land via M-Pesa the moment a job is marked complete. Track it all here.",
  },
  {
    target: "nav-messages",
    title: "Stay in the loop",
    body: "Chat with clients and get notified the moment there's news about a job.",
  },
  {
    target: "nav-account",
    title: "Your profile",
    body: "Manage your details, verification status, and settings here.",
  },
];

const CLIENT_STEPS: Step[] = [
  {
    target: "card-workers",
    title: "Hire trusted workers",
    body: "Browse skilled, verified workers near you — filter by category and see ratings before you hire.",
  },
  {
    target: "card-post-job",
    title: "Post a job in minutes",
    body: "Describe what you need and your budget. Nearby workers see it right away.",
  },
  {
    target: "nav-messages",
    title: "Stay in the loop",
    body: "Chat with workers and track booking status, all from one place.",
  },
  {
    target: "nav-account",
    title: "Your profile",
    body: "Manage your details and settings here.",
  },
];

type Rect = { top: number; left: number; width: number; height: number };

function rectOf(el: HTMLElement): Rect {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export default function FeatureTour({ role }: { role: "WORKER" | "CLIENT" }) {
  const steps = role === "WORKER" ? WORKER_STEPS : CLIENT_STEPS;
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads localStorage, only known client-side
    if (!localStorage.getItem(STORAGE_KEY)) setActive(true);
  }, []);

  const finish = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "1");
    setActive(false);
  }, []);

  // Locate + scroll to the current step's target, retrying briefly since the
  // bottom nav mounts after its own async session fetch.
  useEffect(() => {
    if (!active) return;
    cancelledRef.current = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the spotlight while the new target is located
    setRect(null);
    const selector = steps[stepIndex].target;
    const startedAt = Date.now();

    function poll() {
      if (cancelledRef.current) return;
      const el = document.querySelector<HTMLElement>(`[data-tour="${selector}"]`);
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        window.setTimeout(() => {
          if (!cancelledRef.current) setRect(rectOf(el));
        }, 300);
        return;
      }
      if (Date.now() - startedAt > FIND_TIMEOUT_MS) {
        // Target never appeared — skip this step rather than getting stuck.
        if (stepIndex < steps.length - 1) setStepIndex((i) => i + 1);
        else finish();
        return;
      }
      window.setTimeout(poll, FIND_POLL_MS);
    }
    poll();

    return () => {
      cancelledRef.current = true;
    };
  }, [active, stepIndex, steps, finish]);

  useEffect(() => {
    if (!active || !rect) return;
    function recompute() {
      const el = document.querySelector<HTMLElement>(`[data-tour="${steps[stepIndex].target}"]`);
      if (el) setRect(rectOf(el));
    }
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-bind when the visible target changes
  }, [active, stepIndex]);

  if (!active || !rect) return null;

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  const spaceBelow = window.innerHeight - (rect.top + rect.height);
  const placeBelow = spaceBelow > 190 || rect.top < 190;
  const centerX = rect.left + rect.width / 2;
  const tooltipLeft = Math.min(
    Math.max(centerX - TOOLTIP_WIDTH / 2, PAD),
    window.innerWidth - TOOLTIP_WIDTH - PAD
  );
  const arrowLeft = Math.min(Math.max(centerX - tooltipLeft, 20), TOOLTIP_WIDTH - 20);

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true">
      <div
        aria-hidden="true"
        className="absolute rounded-2xl ring-2 ring-brand transition-all duration-300 ease-out pointer-events-none"
        style={{
          top: rect.top - PAD,
          left: rect.left - PAD,
          width: rect.width + PAD * 2,
          height: rect.height + PAD * 2,
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.78)",
        }}
      />

      <div
        className="absolute w-[280px] bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-2xl shadow-black/50 transition-all duration-300 ease-out"
        style={{
          left: tooltipLeft,
          top: placeBelow ? rect.top + rect.height + PAD + GAP : undefined,
          bottom: placeBelow ? undefined : window.innerHeight - (rect.top - PAD) + GAP,
        }}
      >
        <div
          aria-hidden="true"
          className="absolute w-3 h-3 bg-neutral-900 border-neutral-800 rotate-45"
          style={
            placeBelow
              ? { top: -6, left: arrowLeft - 6, borderTop: "1px solid", borderLeft: "1px solid" }
              : { bottom: -6, left: arrowLeft - 6, borderBottom: "1px solid", borderRight: "1px solid" }
          }
        />

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === stepIndex ? "w-5 bg-brand" : "w-1.5 bg-neutral-700"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={finish}
            className="text-neutral-500 text-xs font-medium active:opacity-60 transition"
          >
            Skip
          </button>
        </div>

        <h3 className="text-white font-semibold text-sm">{step.title}</h3>
        <p className="text-neutral-400 text-xs mt-1.5 leading-relaxed">{step.body}</p>

        <div className="flex items-center gap-2 mt-3.5">
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={() => setStepIndex((i) => i - 1)}
              className="px-3 py-2 text-xs font-semibold text-neutral-300 active:opacity-60 transition"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={() => (isLast ? finish() : setStepIndex((i) => i + 1))}
            className="flex-1 bg-brand text-white text-xs font-semibold rounded-full py-2.5 active:scale-[0.98] transition"
          >
            {isLast ? "Got it" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
