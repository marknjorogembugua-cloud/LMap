"use client";

import { useState } from "react";
import { ShareIcon } from "@heroicons/react/24/outline";
import { useTap } from "@/lib/use-tap";

export default function ShareButton({ title, text }: { title: string; text: string }) {
  const { tapKey, bump } = useTap();
  const [copied, setCopied] = useState(false);

  async function share() {
    bump();
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // User cancelled or the share sheet failed — fall through to clipboard.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied — nothing more we can do here.
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="relative flex items-center justify-center w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 active:scale-[0.94] transition shrink-0"
      aria-label="Share"
    >
      <ShareIcon key={tapKey} className="w-4 h-4 animate-icon-pop" strokeWidth={1.75} />
      {copied && (
        <span className="absolute -bottom-8 right-0 bg-neutral-800 text-white text-xs px-2.5 py-1 rounded-lg whitespace-nowrap shadow-lg">
          Link copied
        </span>
      )}
    </button>
  );
}
