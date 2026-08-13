import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/require-user";
import { workerProfileSchema } from "@/lib/validators";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const auth = await requireRole("WORKER");
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const parsed = workerProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const profile = await prisma.workerProfile.upsert({
    where: { userId: auth.session.userId },
    create: {
      userId: auth.session.userId,
      ...parsed.data,
    },
    update: parsed.data,
  });

  return NextResponse.json({ ok: true, profile });
}
