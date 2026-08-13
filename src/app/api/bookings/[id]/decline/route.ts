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

  const isClient = booking.gig.clientId === auth.session.userId;
  const isWorker = booking.workerId === auth.session.userId;
  if (!isClient && !isWorker) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  if (booking.status !== "REQUESTED") {
    return NextResponse.json({ error: "Booking is not pending" }, { status: 400 });
  }

  const updated = await prisma.booking.update({ where: { id }, data: { status: "DECLINED" } });

  await notify({
    userId: isClient ? booking.workerId : booking.gig.clientId,
    type: "APPLICATION_DECLINED",
    title: isClient ? "Application declined" : "Applicant withdrew",
    body: booking.gig.title,
    entityUrl: `/jobs/${booking.gigId}`,
    bookingId: booking.id,
    gigId: booking.gigId,
  });

  return NextResponse.json({ ok: true, booking: updated });
}
