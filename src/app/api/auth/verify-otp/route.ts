import { NextRequest, NextResponse } from "next/server";
import { verifyOtpSchema, normalizeKenyanPhone } from "@/lib/validators";
import { consumeOtp } from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import { createSession, setSessionCookie } from "@/lib/session";
import { Prisma } from "@/generated/prisma/client";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = verifyOtpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const channel = parsed.data.email ? "EMAIL" : "PHONE";
  const identifier = parsed.data.email ?? normalizeKenyanPhone(parsed.data.phone!)!;

  let user =
    channel === "EMAIL"
      ? await prisma.user.findUnique({ where: { email: identifier } })
      : await prisma.user.findUnique({ where: { phone: identifier } });

  const contactPhone =
    channel === "EMAIL" && parsed.data.phone ? normalizeKenyanPhone(parsed.data.phone) : null;

  const valid = await consumeOtp(identifier, channel, parsed.data.code);
  if (!valid) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
  }

  if (parsed.data.mode === "login" && !user) {
    return NextResponse.json(
      { error: "No account found for that contact — sign up first" },
      { status: 400 }
    );
  }
  if (parsed.data.mode === "signup" && user) {
    return NextResponse.json(
      { error: "An account already exists for that contact — log in instead" },
      { status: 400 }
    );
  }

  if (!user) {
    if (channel === "EMAIL") {
      try {
        user = await prisma.user.create({
          data: {
            email: identifier,
            phone: contactPhone,
            name: parsed.data.name,
            primaryRole: parsed.data.primaryRole ?? "CLIENT",
          },
        });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          return NextResponse.json(
            { error: "That phone number is already registered — log in with phone instead" },
            { status: 400 }
          );
        }
        throw err;
      }
    } else {
      user = await prisma.user.create({
        data: {
          phone: identifier,
          name: parsed.data.name,
          primaryRole: parsed.data.primaryRole ?? "CLIENT",
        },
      });
    }
  }

  const token = await createSession({
    userId: user.id,
    phone: user.phone,
    primaryRole: user.primaryRole,
  });
  await setSessionCookie(token);

  return NextResponse.json({ ok: true, user });
}
