const STYLES: Record<string, string> = {
  OPEN: "bg-green-500/15 text-green-400",
  BOOKED: "bg-indigo-500/15 text-indigo-300",
  COMPLETED: "bg-neutral-700 text-neutral-300",
  CANCELLED: "bg-red-500/15 text-red-400",
  REQUESTED: "bg-amber-500/15 text-amber-400",
  ACCEPTED: "bg-indigo-500/15 text-indigo-300",
  DECLINED: "bg-red-500/15 text-red-400",
  IN_PROGRESS: "bg-violet-500/15 text-violet-300",
  PENDING: "bg-amber-500/15 text-amber-400",
  SUCCESS: "bg-green-500/15 text-green-400",
  FAILED: "bg-red-500/15 text-red-400",
  LOW: "bg-neutral-800 text-neutral-400",
  MEDIUM: "bg-amber-500/15 text-amber-400",
  // Distinct from the brand red so "urgent" never reads as a brand-colored element.
  HIGH: "bg-orange-500/15 text-orange-400",
};

const LABELS: Record<string, string> = {
  IN_PROGRESS: "In progress",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
        STYLES[status] ?? "bg-neutral-800 text-neutral-300"
      }`}
    >
      {LABELS[status] ?? status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
