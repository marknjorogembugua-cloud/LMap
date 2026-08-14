import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nameSchema } from "@/lib/validators";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { nameChangeEligibility } from "@/lib/name-cooldown";

const schema = z.object({ name: nameSchema });

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { id: auth.session.userId },
    select: { createdAt: true, nameUpdatedAt: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { canEdit, nextEditableAt } = nameChangeEligibility(existing);
  if (!canEdit) {
    return NextResponse.json(
      { error: "You can change your name again on " + nextEditableAt.toLocaleDateString(), nextEditableAt },
      { status: 403 }
    );
  }

  const now = new Date();
  const user = await prisma.user.update({
    where: { id: auth.session.userId },
    data: { name: parsed.data.name, nameUpdatedAt: now },
  });

  return NextResponse.json({ ok: true, user });
}
