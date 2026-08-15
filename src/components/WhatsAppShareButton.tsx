"use client";

import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/solid";
import { buildWhatsAppShareLink } from "@/lib/whatsapp";
import { useTap } from "@/lib/use-tap";

const WHATSAPP_GREEN = "#25D366";

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
      style={{ backgroundColor: WHATSAPP_GREEN, boxShadow: `0 10px 20px -8px ${WHATSAPP_GREEN}66` }}
      className={`flex items-center justify-center gap-2 text-white font-semibold rounded-xl py-3 active:scale-[0.98] transition ${className}`}
    >
      <ChatBubbleLeftRightIcon key={tapKey} className="w-[18px] h-[18px] shrink-0 animate-icon-pop" />
      {label}
    </button>
  );
}
