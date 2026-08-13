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
  if (booking.gig.clientId !== auth.session.userId) {
    return NextResponse.json({ error: "Only the client can mark the job complete" }, { status: 403 });
  }
  if (booking.status !== "IN_PROGRESS") {
    return NextResponse.json({ error: "Job must be in progress first" }, { status: 400 });
  }

  const [updated] = await prisma.$transaction([
    prisma.booking.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: new Date() },
    }),
    prisma.gig.update({ where: { id: booking.gigId }, data: { status: "COMPLETED" } }),
  ]);

  await notify({
    userId: booking.workerId,
    type: "BOOKING_COMPLETED",
    title: "Job marked complete",
    body: booking.gig.title,
    entityUrl: `/messages/${booking.id}`,
    bookingId: booking.id,
    gigId: booking.gigId,
  });

  return NextResponse.json({ ok: true, booking: updated });
}
