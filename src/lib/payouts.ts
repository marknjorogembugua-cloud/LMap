import { prisma } from "@/lib/prisma";
import { b2cPayment } from "@/lib/mpesa";

const DEFAULT_COMMISSION_PERCENT = 5;

/**
 * Pays the worker their share of a completed, paid booking via M-Pesa B2C,
 * minus the platform commission. Never throws — a payout failure (expected
 * until real B2C credentials are provisioned) must not affect the client's
 * already-successful payment record. Idempotent: a booking only ever gets
 * one Payout row.
 */
export async function initiatePayout(bookingId: string) {
  const existing = await prisma.payout.findUnique({ where: { bookingId } });
  if (existing) return;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { worker: { select: { id: true, phone: true } }, gig: { select: { title: true } } },
  });
  if (!booking) return;

  if (!booking.worker.phone) {
    console.error(`Cannot pay out booking ${bookingId}: worker has no phone on file`);
    return;
  }

  const commissionPercent = Number(process.env.PLATFORM_COMMISSION_PERCENT ?? DEFAULT_COMMISSION_PERCENT);
  const commissionKes = Math.round((booking.agreedAmountKes * commissionPercent) / 100);
  const netAmountKes = booking.agreedAmountKes - commissionKes;

  const payout = await prisma.payout.create({
    data: {
      bookingId: booking.id,
      workerId: booking.worker.id,
      phoneNumber: booking.worker.phone,
      grossAmountKes: booking.agreedAmountKes,
      commissionKes,
      netAmountKes,
      status: "PENDING",
    },
  });

  try {
    const result = await b2cPayment({
      phone: booking.worker.phone,
      amountKes: netAmountKes,
      remarks: `Payout for ${booking.gig.title}`,
    });
    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        status: "PROCESSING",
        conversationId: result.ConversationID,
        originatorConversationId: result.OriginatorConversationID,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "B2C payout request failed";
    console.error(`Payout initiation failed for booking ${bookingId}:`, message);
    await prisma.payout.update({
      where: { id: payout.id },
      data: { status: "FAILED", resultDesc: message },
    });
  }
}
