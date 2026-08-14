import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type B2CTimeoutBody = {
  Result?: { ConversationID?: string; ResultDesc?: string };
};

// Public endpoint — Safaricom's QueueTimeOutURL, hit when a B2C request
// isn't acknowledged in time.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as B2CTimeoutBody | null;
  const conversationId = body?.Result?.ConversationID;

  if (conversationId) {
    await prisma.payout.updateMany({
      where: { conversationId, status: { in: ["PENDING", "PROCESSING"] } },
      data: { status: "FAILED", resultDesc: body?.Result?.ResultDesc ?? "Request timed out" },
    });
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
