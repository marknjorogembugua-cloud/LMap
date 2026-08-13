import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const profile = await prisma.workerProfile.findUnique({ where: { id } });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.workerProfile.update({
    where: { id },
    data: { verified: false, verificationStatus: "REJECTED" },
  });

  return NextResponse.json({ ok: true, profile: updated });
}
