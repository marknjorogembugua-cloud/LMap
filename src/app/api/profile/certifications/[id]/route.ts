import { NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const certification = await prisma.certification.findUnique({
    where: { id },
    include: { workerProfile: { select: { userId: true } } },
  });
  if (!certification) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (certification.workerProfile.userId !== auth.session.userId) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  await prisma.certification.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
