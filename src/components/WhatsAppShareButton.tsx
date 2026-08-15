"use client";

import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { buildWhatsAppShareLink } from "@/lib/whatsapp";
import { useTap } from "@/lib/use-tap";

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
      className={`w-full flex items-center justify-center gap-2 bg-[#25D366] text-white font-semibold rounded-xl py-2.5 text-sm shadow-lg shadow-[#25D366]/25 active:scale-[0.98] transition ${className}`}
    >
      <ChatBubbleLeftRightIcon key={tapKey} className="w-4 h-4 shrink-0 animate-icon-pop" strokeWidth={2} />
      {label}
    </button>
  );
}
