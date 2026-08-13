import { NextRequest, NextResponse } from "next/server";
import { requestOtpSchema, normalizeKenyanPhone } from "@/lib/validators";
import { issueOtp } from "@/lib/otp";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = requestOtpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const identifier = parsed.data.email ?? normalizeKenyanPhone(parsed.data.phone!)!;
  const channel = parsed.data.email ? "EMAIL" : "PHONE";

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
