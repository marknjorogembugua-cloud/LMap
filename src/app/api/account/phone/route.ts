import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { phoneSchema, normalizeKenyanPhone } from "@/lib/validators";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { createSession, setSessionCookie } from "@/lib/session";
import { Prisma } from "@/generated/prisma/client";

const schema = z.object({ phone: phoneSchema });

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const phone = normalizeKenyanPhone(parsed.data.phone)!;

  let user;
  try {
    user = await prisma.user.update({ where: { id: auth.session.userId }, data: { phone } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "That phone number is already in use" }, { status: 400 });
    }
    throw err;
  }

  const token = await createSession({
    userId: user.id,
    phone: user.phone,
    primaryRole: user.primaryRole,
  });
  await setSessionCookie(token);

  return NextResponse.json({ ok: true, user });
}
