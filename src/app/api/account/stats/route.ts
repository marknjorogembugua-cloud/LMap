import { NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { userId, primaryRole } = auth.session;

  if (primaryRole === "WORKER") {
    const [earned, completedCount, activeCount, profile] = await Promise.all([
      prisma.payout.aggregate({
        where: { status: "SUCCESS", workerId: userId },
        _sum: { netAmountKes: true },
      }),
      prisma.booking.count({ where: { workerId: userId, status: "COMPLETED" } }),
      prisma.booking.count({ where: { workerId: userId, status: { in: ["ACCEPTED", "IN_PROGRESS"] } } }),
      prisma.workerProfile.findUnique({
        where: { userId },
        select: { ratingAvg: true, ratingCount: true },
      }),
    ]);

    return NextResponse.json({
      role: "WORKER",
      stats: {
        totalEarnedKes: earned._sum.netAmountKes ?? 0,
        completedCount,
        activeCount,
        ratingAvg: profile?.ratingAvg ?? 0,
        ratingCount: profile?.ratingCount ?? 0,
      },
    });
  }

  const [spent, postedCount, hiredCount, openCount] = await Promise.all([
    prisma.transaction.aggregate({
      where: { status: "SUCCESS", booking: { gig: { clientId: userId } } },
      _sum: { amountKes: true },
    }),
    prisma.gig.count({ where: { clientId: userId } }),
    prisma.booking.count({
      where: { gig: { clientId: userId }, status: { in: ["ACCEPTED", "IN_PROGRESS", "COMPLETED"] } },
    }),
    prisma.gig.count({ where: { clientId: userId, status: "OPEN" } }),
  ]);

  return NextResponse.json({
    role: "CLIENT",
    stats: {
      totalSpentKes: spent._sum.amountKes ?? 0,
      postedCount,
      hiredCount,
      openCount,
    },
  });
}
