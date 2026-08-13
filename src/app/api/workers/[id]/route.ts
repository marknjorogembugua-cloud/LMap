import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const worker = await prisma.workerProfile.findUnique({
    where: { userId: id },
    include: {
      certifications: { orderBy: [{ year: "desc" }, { createdAt: "desc" }] },
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          phone: true,
          reviewsReceived: {
            include: { reviewer: { select: { name: true } } },
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      },
    },
  });

  if (!worker) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ worker });
}
