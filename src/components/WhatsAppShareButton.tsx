"use client";

import { buildWhatsAppShareLink } from "@/lib/whatsapp";
import { useTap } from "@/lib/use-tap";

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="12" fill="#25D366" />
      <path
        d="M16.7 7.3a5.9 5.9 0 0 0-9.2 7.1L7 17.5l3.2-.8a5.9 5.9 0 0 0 8.2-7.9 5.9 5.9 0 0 0-1.7-1.5Z"
        fill="none"
      />
      <path
        d="M16.4 7.6a5.4 5.4 0 0 0-8.5 6.5l.2.4-.6 2.2 2.3-.6.4.2a5.4 5.4 0 0 0 7.7-4.8 5.4 5.4 0 0 0-1.5-3.9Z"
        fill="#ffffff"
      />
      <path
        d="M14.5 13.1c-.2-.1-1.1-.5-1.3-.6-.2-.1-.3-.1-.4.1-.1.2-.5.6-.6.7-.1.1-.2.1-.4 0-.2-.1-.8-.3-1.5-.9-.6-.5-.9-1.1-1-1.3-.1-.2 0-.3.1-.4l.3-.3.1-.2v-.2c0-.1-.4-1-.6-1.3-.1-.3-.3-.2-.4-.2h-.3c-.1 0-.3 0-.5.2-.2.2-.6.6-.6 1.5s.7 1.7.8 1.8c.1.1 1.3 2 3.2 2.8.4.2.8.3 1 .4.5.1.9.1 1.2 0 .4 0 1.1-.4 1.2-.9.2-.4.2-.8.1-.9-.1-.1-.2-.1-.4-.2Z"
        fill="#25D366"
      />
    </svg>
  );
}

export default function WhatsAppShareButton({
  message,
  label = "Share on WhatsApp",
  className = "",
}: {
  message: string;
  label?: string;
  className?: string;
}) {
  const { tapKey, bump } = useTap();

  function share() {
    bump();
    const fullMessage = typeof window !== "undefined" ? `${message} ${window.location.origin}` : message;
    window.open(buildWhatsAppShareLink(fullMessage), "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      onClick={share}
      className={`flex items-center justify-center gap-2 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] font-semibold rounded-xl py-3 active:scale-[0.98] transition ${className}`}
    >
      <WhatsAppGlyph key={tapKey} className="w-5 h-5 shrink-0 animate-icon-pop" />
      {label}
    </button>
  );
}
