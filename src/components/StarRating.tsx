import { StarIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline";

export default function StarRating({ value, count }: { value: number; count?: number }) {
  const rounded = Math.round(value);
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <span className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) =>
          i < rounded ? (
            <StarIcon key={i} className="w-3.5 h-3.5 text-amber-500" />
          ) : (
            <StarOutlineIcon key={i} className="w-3.5 h-3.5 text-neutral-700" />
          )
        )}
      </span>
      <span className="text-neutral-400">
        {value > 0 ? value.toFixed(1) : "New"}
        {typeof count === "number" ? ` (${count})` : ""}
      </span>
    </span>
  );
}
