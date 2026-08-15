/** Builds a wa.me deep link that opens WhatsApp with the message pre-filled, ready to send to any chat/group. */
export function buildWhatsAppShareLink(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
