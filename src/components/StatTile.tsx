import type { ComponentType, SVGProps } from "react";

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

export default function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: HeroIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4">
      <Icon className="w-5 h-5 text-brand" strokeWidth={1.75} />
      <p className="text-xl font-bold text-white tracking-tight mt-2 tabular-nums">{value}</p>
      <p className="text-neutral-500 text-xs mt-0.5">{label}</p>
    </div>
  );
}
