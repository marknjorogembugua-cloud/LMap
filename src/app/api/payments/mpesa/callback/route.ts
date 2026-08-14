import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseStkCallback, MpesaCallbackBody } from "@/lib/mpesa";
import { initiatePayout } from "@/lib/payouts";

// Public endpoint — called by Safaricom's servers, not the browser.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as MpesaCallbackBody | null;
  if (!body?.Body?.stkCallback) {
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Invalid payload" });
  }

  const result = parseStkCallback(body);

  const transaction = await prisma.transaction.findFirst({
    where: { checkoutRequestId: result.checkoutRequestId },
  });

  if (transaction) {
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: result.success ? "SUCCESS" : "FAILED",
        resultDesc: result.resultDesc,
        mpesaReceiptNumber: result.mpesaReceiptNumber,
      },
    });

    if (result.success) {
      // The client's payment is already recorded above regardless of what
      // happens next — a payout failure must never undo that.
      await initiatePayout(transaction.bookingId).catch((err) =>
        console.error("initiatePayout threw unexpectedly:", err)
      );
    }
  }

  // Safaricom expects a 200 with this exact shape to stop retrying.
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
