"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  BriefcaseIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType, SVGProps } from "react";
import { useSession } from "@/lib/use-session";
import { useShowChrome } from "@/lib/use-chrome";
import { useTap } from "@/lib/use-tap";

const WORKER_ITEMS = [
  { href: "/dashboard", label: "Home", icon: HomeIcon, tourId: "nav-home" },
  { href: "/jobs", label: "Jobs", icon: BriefcaseIcon, tourId: "nav-jobs" },
  { href: "/messages", label: "Messages", icon: ChatBubbleLeftRightIcon, tourId: "nav-messages" },
  { href: "/account", label: "Account", icon: UserCircleIcon, tourId: "nav-account" },
];

const CLIENT_ITEMS = [
  { href: "/dashboard", label: "Home", icon: HomeIcon, tourId: "nav-home" },
  { href: "/workers", label: "Workers", icon: UsersIcon, tourId: "nav-workers" },
  { href: "/messages", label: "Messages", icon: ChatBubbleLeftRightIcon, tourId: "nav-messages" },
  { href: "/account", label: "Account", icon: UserCircleIcon, tourId: "nav-account" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useSession();
  const showChrome = useShowChrome();

  if (!showChrome || !user) return null;

  const items = user.primaryRole === "WORKER" ? WORKER_ITEMS : CLIENT_ITEMS;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-neutral-900/90 backdrop-blur-md border-t border-neutral-800 flex safe-area-bottom">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={active}
            tourId={item.tourId}
          />
        );
      })}
    </nav>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  tourId,
}: {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  active: boolean;
  tourId: string;
}) {
  const { tapKey, bump } = useTap();
  return (
    <Link
      href={href}
      onClick={bump}
      data-tour={tourId}
      className={`relative flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] transition-colors ${
        active ? "text-brand font-semibold" : "text-neutral-400"
      }`}
    >
      {active && (
        <span
          className="absolute top-1 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-brand/10 -z-10"
          aria-hidden="true"
        />
      )}
      <Icon key={tapKey} className="w-5 h-5 animate-icon-pop" strokeWidth={active ? 2.25 : 1.75} />
      {label}
    </Link>
  );
}
