import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BriefcaseIcon,
  UsersIcon,
  DocumentPlusIcon,
  ChatBubbleLeftRightIcon,
  ChevronRightIcon,
  StarIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType, SVGProps } from "react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import StatTile from "@/components/StatTile";

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { workerProfile: true },
  });
  if (!user) redirect("/");

  const isWorker = user.primaryRole === "WORKER";

  const [pendingBookingCount, completedCount, liveGigCount] = await Promise.all([
    isWorker
      ? prisma.booking.count({ where: { workerId: user.id, status: "REQUESTED" } })
      : prisma.booking.count({ where: { gig: { clientId: user.id }, status: "REQUESTED" } }),
    isWorker
      ? prisma.booking.count({ where: { workerId: user.id, status: "COMPLETED" } })
      : prisma.gig.count({ where: { clientId: user.id, status: "COMPLETED" } }),
    isWorker
      ? prisma.gig.count({ where: { status: "OPEN", targetWorkerId: null } })
      : prisma.gig.count({ where: { clientId: user.id, status: { in: ["OPEN", "BOOKED"] } } }),
  ]);

  const rating = user.workerProfile?.ratingCount ? user.workerProfile.ratingAvg.toFixed(1) : "New";

  return (
    <main className="relative px-6 py-8 max-w-md mx-auto w-full overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-24 w-72 h-72 bg-brand/15 rounded-full blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative flex items-center gap-3">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- user-uploaded photo, no next/image domain config
          <img
            src={user.avatarUrl}
            alt={user.name ?? "Profile photo"}
            className="w-12 h-12 rounded-full object-cover shrink-0 ring-2 ring-neutral-800"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand to-brand-bright text-white flex items-center justify-center text-base font-bold shrink-0">
            {(user.name ?? "L").charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-neutral-500 text-xs font-medium uppercase tracking-wide">{greeting()}</p>
          <h1 className="text-2xl font-bold text-white tracking-tight leading-tight">
            {user.name?.split(" ")[0] ?? "there"}
          </h1>
        </div>
      </div>

      <div className="relative grid grid-cols-2 gap-3 mt-7">
        <StatTile
          icon={isWorker ? StarIcon : BriefcaseIcon}
          label={isWorker ? "Rating" : "Live jobs"}
          value={isWorker ? rating : String(liveGigCount)}
        />
        <StatTile icon={CheckBadgeIcon} label="Completed" value={String(completedCount)} />
      </div>

      <p className="relative text-neutral-500 text-xs font-semibold uppercase tracking-wide mt-8 mb-3">
        Quick actions
      </p>

      {isWorker ? (
        <div className="relative flex flex-col gap-3">
          <PrimaryCard
            href="/jobs"
            icon={BriefcaseIcon}
            title="Find jobs"
            subtitle={`${liveGigCount} open near you`}
          />
        </div>
      ) : (
        <div className="relative grid grid-cols-2 gap-3">
          <PrimaryCard href="/workers" icon={UsersIcon} title="Hire someone" subtitle="Browse workers" />
          <PrimaryCard href="/jobs/new" icon={DocumentPlusIcon} title="Post a job" subtitle="Get help fast" />
        </div>
      )}

      <Link
        href="/messages"
        className="relative flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 mt-3 active:scale-[0.98] transition"
      >
        <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand/10 text-brand shrink-0">
          <ChatBubbleLeftRightIcon className="w-5 h-5" strokeWidth={1.75} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm">Messages</p>
          <p className="text-neutral-400 text-xs mt-0.5">
            {pendingBookingCount > 0
              ? `${pendingBookingCount} pending request${pendingBookingCount > 1 ? "s" : ""}`
              : "Track your jobs"}
          </p>
        </div>
        {pendingBookingCount > 0 && (
          <span className="flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-brand text-white text-[11px] font-bold">
            {pendingBookingCount}
          </span>
        )}
        <ChevronRightIcon className="w-4 h-4 text-neutral-600 shrink-0" strokeWidth={2} />
      </Link>
    </main>
  );
}

function PrimaryCard({
  href,
  icon: Icon,
  title,
  subtitle,
}: {
  href: string;
  icon: HeroIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="group relative bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-5 flex flex-col gap-4 shadow-lg shadow-black/30 active:scale-[0.98] transition"
    >
      <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-brand/10 text-brand">
        <Icon className="w-5 h-5" strokeWidth={1.75} />
      </span>
      <div>
        <p className="font-semibold text-white text-sm">{title}</p>
        <p className="text-neutral-400 text-xs mt-0.5">{subtitle}</p>
      </div>
      <ChevronRightIcon
        className="absolute top-5 right-5 w-4 h-4 text-neutral-600 group-active:translate-x-0.5 transition"
        strokeWidth={2}
      />
    </Link>
  );
}
