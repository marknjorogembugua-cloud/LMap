import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { disputeResolveSchema } from "@/lib/validators";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = disputeResolveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const dispute = await prisma.dispute.findUnique({
    where: { id },
    include: { booking: { include: { gig: true } } },
  });
  if (!dispute) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (dispute.status === "RESOLVED") {
    return NextResponse.json({ error: "Already resolved" }, { status: 400 });
  }

  const updated = await prisma.dispute.update({
    where: { id },
    data: {
      status: "RESOLVED",
      resolution: parsed.data.resolution,
      resolutionNote: parsed.data.note,
      resolvedAt: new Date(),
    },
  });

  if (parsed.data.resolution === "REFUND_CLIENT") {
    // Cancels the booking and records the decision. Actually moving money
    // back is a manual step in the Safaricom portal (or a future B2C
    // reversal integration) — not something triggered here.
    await prisma.booking.update({ where: { id: dispute.bookingId }, data: { status: "CANCELLED" } });
  }

  const booking = dispute.booking;
  const otherPartyId =
    dispute.raisedById === booking.gig.clientId ? booking.workerId : booking.gig.clientId;

  await Promise.all(
    [dispute.raisedById, otherPartyId].map((userId) =>
      notify({
        userId,
        type: "DISPUTE_RESOLVED",
        title: "Dispute resolved",
        body: `"${booking.gig.title}" — ${parsed.data.resolution.replace(/_/g, " ").toLowerCase()}`,
        entityUrl: `/messages/${booking.id}`,
        bookingId: booking.id,
      })
    )
  );

  return NextResponse.json({ ok: true, dispute: updated });
}
