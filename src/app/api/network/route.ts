import { NextResponse } from "next/server";
import { requireRole } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireRole("WORKER");
  if ("error" in auth) return auth.error;

  const bookings = await prisma.booking.findMany({
    where: { workerId: auth.session.userId, status: "COMPLETED" },
    select: {
      id: true,
      agreedAmountKes: true,
      completedAt: true,
      gig: {
        select: {
          title: true,
          client: { select: { id: true, name: true, avatarUrl: true } },
        },
      },
    },
    orderBy: { completedAt: "desc" },
  });

  const byClient = new Map<
    string,
    {
      client: { id: string; name: string | null; avatarUrl: string | null };
      jobsCount: number;
      totalEarnedKes: number;
      lastBookingId: string;
      lastJobTitle: string;
      lastWorkedAt: Date | null;
    }
  >();

  for (const b of bookings) {
    const client = b.gig.client;
    const existing = byClient.get(client.id);
    if (existing) {
      existing.jobsCount += 1;
      existing.totalEarnedKes += b.agreedAmountKes;
    } else {
      byClient.set(client.id, {
        client,
        jobsCount: 1,
        totalEarnedKes: b.agreedAmountKes,
        lastBookingId: b.id,
        lastJobTitle: b.gig.title,
        lastWorkedAt: b.completedAt,
      });
    }
  }

  return NextResponse.json({ network: Array.from(byClient.values()) });
}
