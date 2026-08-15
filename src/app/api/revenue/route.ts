import { NextResponse } from "next/server";
import { requireRole } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";

const WEEKS = 8;

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function GET() {
  const auth = await requireRole("WORKER");
  if ("error" in auth) return auth.error;
  const workerId = auth.session.userId;

  const currentWeekStart = startOfWeek(new Date());
  const weeks = Array.from({ length: WEEKS }, (_, i) => {
    const start = new Date(currentWeekStart);
    start.setDate(start.getDate() - (WEEKS - 1 - i) * 7);
    return { start, label: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }) };
  });

  const [payouts, allTime] = await Promise.all([
    prisma.payout.findMany({
      where: { workerId, status: "SUCCESS", createdAt: { gte: weeks[0].start } },
      select: { netAmountKes: true, createdAt: true },
    }),
    prisma.payout.aggregate({
      where: { workerId, status: "SUCCESS" },
      _sum: { netAmountKes: true },
    }),
  ]);

  const weekIndexByTime = new Map(weeks.map((w, i) => [w.start.getTime(), i]));
  const series = weeks.map((w) => ({ label: w.label, amountKes: 0 }));

  for (const p of payouts) {
    const idx = weekIndexByTime.get(startOfWeek(p.createdAt).getTime());
    if (idx !== undefined) series[idx].amountKes += p.netAmountKes;
  }

  return NextResponse.json({
    totalEarnedKes: allTime._sum.netAmountKes ?? 0,
    thisWeekKes: series[series.length - 1]?.amountKes ?? 0,
    series,
  });
}
