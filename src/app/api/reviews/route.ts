import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { reviewSchema } from "@/lib/validators";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    include: { gig: true },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.status !== "COMPLETED") {
    return NextResponse.json({ error: "You can only review completed jobs" }, { status: 400 });
  }

  const userId = auth.session.userId;
  const isWorker = booking.workerId === userId;
  const isClient = booking.gig.clientId === userId;
  if (!isWorker && !isClient) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  const revieweeId = isWorker ? booking.gig.clientId : booking.workerId;

  const existing = await prisma.review.findUnique({
    where: { bookingId_reviewerId: { bookingId: booking.id, reviewerId: userId } },
  });
  if (existing) {
    return NextResponse.json({ error: "You already reviewed this job" }, { status: 400 });
  }

  const review = await prisma.review.create({
    data: {
      bookingId: booking.id,
      reviewerId: userId,
      revieweeId,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
  });

  // Keep the worker's aggregate rating in sync when the reviewee is a worker.
  const revieweeProfile = await prisma.workerProfile.findUnique({ where: { userId: revieweeId } });
  if (revieweeProfile) {
    const agg = await prisma.review.aggregate({
      where: { revieweeId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await prisma.workerProfile.update({
      where: { userId: revieweeId },
      data: {
        ratingAvg: agg._avg.rating ?? 0,
        ratingCount: agg._count.rating,
      },
    });
  }

  return NextResponse.json({ ok: true, review });
}
