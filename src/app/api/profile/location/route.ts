import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/require-user";
import { locationUpdateSchema } from "@/lib/validators";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const auth = await requireRole("WORKER");
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const parsed = locationUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const profile = await prisma.workerProfile
    .update({
      where: { userId: auth.session.userId },
      data: { lat: parsed.data.lat, lng: parsed.data.lng, locationUpdatedAt: new Date() },
    })
    .catch(() => null);

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
