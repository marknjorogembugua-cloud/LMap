import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { stkPush } from "@/lib/mpesa";
import { z } from "zod";

const schema = z.object({ bookingId: z.string() });

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    include: { gig: true, worker: true, transaction: true, dispute: true },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.gig.clientId !== auth.session.userId) {
    return NextResponse.json({ error: "Only the client can pay" }, { status: 403 });
  }
  if (booking.status !== "COMPLETED") {
    return NextResponse.json({ error: "Job must be marked complete before paying" }, { status: 400 });
  }
  if (booking.transaction?.status === "SUCCESS") {
    return NextResponse.json({ error: "This booking has already been paid" }, { status: 400 });
  }
  if (booking.dispute?.status === "OPEN") {
    return NextResponse.json(
      { error: "This booking has an open dispute — payment is on hold until it's resolved" },
      { status: 400 }
    );
  }
  if (!auth.session.phone) {
    return NextResponse.json(
      { error: "Add a phone number to pay via M-Pesa", code: "PHONE_REQUIRED" },
      { status: 400 }
    );
  }

  let result;
  try {
    result = await stkPush({
      phone: auth.session.phone,
      amountKes: booking.agreedAmountKes,
      accountReference: `LinkMe-${booking.id.slice(0, 8)}`,
      description: `Payment for ${booking.gig.title}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "M-Pesa request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const transaction = await prisma.transaction.upsert({
    where: { bookingId: booking.id },
    create: {
      bookingId: booking.id,
      amountKes: booking.agreedAmountKes,
      phoneNumber: auth.session.phone,
      merchantRequestId: result.MerchantRequestID,
      checkoutRequestId: result.CheckoutRequestID,
      status: "PENDING",
    },
    update: {
      merchantRequestId: result.MerchantRequestID,
      checkoutRequestId: result.CheckoutRequestID,
      status: "PENDING",
      resultDesc: null,
    },
  });

  return NextResponse.json({ ok: true, transaction, message: result.CustomerMessage });
}
