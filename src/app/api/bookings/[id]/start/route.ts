import { NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const booking = await prisma.booking.findUnique({ where: { id }, include: { gig: true } });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (booking.workerId !== auth.session.userId) {
    return NextResponse.json({ error: "Only the worker can start the job" }, { status: 403 });
  }
  if (booking.status !== "ACCEPTED") {
    return NextResponse.json({ error: "Booking must be accepted first" }, { status: 400 });
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: "IN_PROGRESS", startedAt: new Date() },
  });

  await notify({
    userId: booking.gig.clientId,
    type: "BOOKING_STARTED",
    title: "Job started",
    body: booking.gig.title,
    entityUrl: `/messages/${booking.id}`,
    bookingId: booking.id,
    gigId: booking.gigId,
  });

  return NextResponse.json({ ok: true, booking: updated });
}
