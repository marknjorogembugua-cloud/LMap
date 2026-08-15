import { NextRequest, NextResponse } from "next/server";
import { requestOtpSchema, normalizeKenyanPhone } from "@/lib/validators";
import { issueOtp } from "@/lib/otp";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = requestOtpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const identifier = parsed.data.email ?? normalizeKenyanPhone(parsed.data.phone!)!;
  const channel = parsed.data.email ? "EMAIL" : "PHONE";

  const existing = parsed.data.email
    ? await prisma.user.findUnique({ where: { email: identifier } })
    : await prisma.user.findUnique({ where: { phone: identifier } });

  if (parsed.data.mode === "signup" && existing) {
    return NextResponse.json(
      { error: "An account already exists for that contact — log in instead" },
      { status: 400 }
    );
  }
  if (parsed.data.mode === "login" && !existing) {
    return NextResponse.json(
      { error: "No account found for that contact — sign up first" },
      { status: 400 }
    );
  }

  try {
    const { devCode } = await issueOtp(identifier, channel);
    return NextResponse.json({ ok: true, ...(devCode ? { devCode } : {}) });
  } catch (err) {
    console.error("Failed to send OTP:", err);
    return NextResponse.json(
      { error: "Couldn't send the verification code. Please try again shortly." },
      { status: 502 }
    );
  }
}
