import { NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const count = await prisma.notification.count({
    where: { userId: auth.session.userId, read: false },
  });

  return NextResponse.json({ count });
}
