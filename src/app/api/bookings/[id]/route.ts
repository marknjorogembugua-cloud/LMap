import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      gig: { include: { client: { select: { id: true, name: true, phone: true } } } },
      worker: { select: { id: true, name: true, phone: true } },
      transaction: true,
      payout: true,
      dispute: true,
      reviews: true,
    },
  });

  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ booking });
}
