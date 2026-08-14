import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { nameChangeEligibility } from "@/lib/name-cooldown";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { workerProfile: true },
  });
  if (!user) return NextResponse.json({ user: null });

  const { canEdit, nextEditableAt } = nameChangeEligibility(user);

  return NextResponse.json({
    user: { ...user, canEditName: canEdit, nameEditableAt: nextEditableAt },
  });
}
