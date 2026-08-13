import { NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  await prisma.notification.updateMany({
    where: { userId: auth.session.userId, read: false },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
