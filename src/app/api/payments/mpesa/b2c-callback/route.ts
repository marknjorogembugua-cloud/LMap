import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseB2CResultCallback, MpesaB2CCallbackBody } from "@/lib/mpesa";

// Public endpoint — called by Safaricom's servers, not the browser.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as MpesaB2CCallbackBody | null;
  if (!body?.Result) {
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Invalid payload" });
  }

  const result = parseB2CResultCallback(body);

  const payout = await prisma.payout.findFirst({
    where: { conversationId: result.conversationId },
  });

  if (payout) {
    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        status: result.success ? "SUCCESS" : "FAILED",
        resultDesc: result.resultDesc,
        mpesaReceiptNumber: result.mpesaReceiptNumber,
      },
    });
  }

  // Safaricom expects a 200 with this exact shape to stop retrying.
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
