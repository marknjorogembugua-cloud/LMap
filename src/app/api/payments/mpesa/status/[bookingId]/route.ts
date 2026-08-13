import { NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { bookingId } = await params;

  const transaction = await prisma.transaction.findUnique({ where: { bookingId } });
  if (!transaction) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ transaction });
}
