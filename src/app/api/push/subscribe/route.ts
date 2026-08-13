import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { pushSubscribeSchema } from "@/lib/validators";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const parsed = pushSubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint: parsed.data.endpoint },
    create: { userId: auth.session.userId, ...parsed.data },
    update: { userId: auth.session.userId, ...parsed.data },
  });

  return NextResponse.json({ ok: true });
}
