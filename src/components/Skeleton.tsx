export function CardSkeleton() {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-neutral-800 shrink-0" />
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="h-3.5 bg-neutral-800 rounded-full w-3/4" />
          <div className="h-3 bg-neutral-800 rounded-full w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function CardSkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
