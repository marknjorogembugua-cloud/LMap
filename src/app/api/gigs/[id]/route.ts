import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const gig = await prisma.gig.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, phone: true } },
      bookings: {
        include: { worker: { select: { id: true, name: true, phone: true } } },
        orderBy: { requestedAt: "desc" },
      },
    },
  });

  if (!gig) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ gig });
}
