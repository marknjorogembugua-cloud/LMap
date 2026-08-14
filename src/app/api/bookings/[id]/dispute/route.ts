import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { disputeCreateSchema } from "@/lib/validators";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { getAdminUserIds } from "@/lib/require-admin";

const DISPUTABLE_STATUSES = ["ACCEPTED", "IN_PROGRESS", "COMPLETED"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = disputeCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { gig: true, dispute: true },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isClient = booking.gig.clientId === auth.session.userId;
  const isWorker = booking.workerId === auth.session.userId;
  if (!isClient && !isWorker) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  if (!DISPUTABLE_STATUSES.includes(booking.status)) {
    return NextResponse.json(
      { error: "This booking can't be disputed yet" },
      { status: 400 }
    );
  }
  if (booking.dispute) {
    return NextResponse.json({ error: "This booking already has an open dispute" }, { status: 400 });
  }

  const dispute = await prisma.dispute.create({
    data: { bookingId: booking.id, raisedById: auth.session.userId, reason: parsed.data.reason },
  });

  const otherPartyId = isClient ? booking.workerId : booking.gig.clientId;
  await notify({
    userId: otherPartyId,
    type: "DISPUTE_RAISED",
    title: "A dispute was raised",
    body: `"${booking.gig.title}" is under review.`,
    entityUrl: `/messages/${booking.id}`,
    bookingId: booking.id,
  });

  const adminIds = await getAdminUserIds();
  await Promise.all(
    adminIds.map((adminId) =>
      notify({
        userId: adminId,
        type: "DISPUTE_RAISED",
        title: "New dispute needs review",
        body: `"${booking.gig.title}" — KES ${booking.agreedAmountKes}`,
        entityUrl: `/admin/disputes`,
        bookingId: booking.id,
      })
    )
  );

  return NextResponse.json({ ok: true, dispute });
}
