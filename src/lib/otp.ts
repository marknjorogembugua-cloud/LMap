import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";
import { sendEmail } from "@/lib/email";

export type OtpChannel = "PHONE" | "EMAIL";

const EXP_MINUTES = Number(process.env.OTP_EXP_MINUTES ?? 5);

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function issueOtp(identifier: string, channel: OtpChannel): Promise<{ devCode?: string }> {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + EXP_MINUTES * 60 * 1000);
  const message = `Your LinkMeApp verification code is ${code}. It expires in ${EXP_MINUTES} minutes.`;

  await prisma.otpCode.create({ data: { identifier, channel, code, expiresAt } });

  const usingConsoleProvider =
    channel === "PHONE"
      ? (process.env.SMS_PROVIDER ?? "console") === "console"
      : (process.env.EMAIL_PROVIDER ?? "console") === "console";

  if (channel === "PHONE") {
    await sendSms(identifier, message);
  } else {
    await sendEmail(identifier, "Your LinkMeApp verification code", message);
  }

  // No real SMS/email provider configured: surface the code so it's usable
  // without reading the server console. Never happens in production.
  if (usingConsoleProvider && process.env.NODE_ENV !== "production") {
    return { devCode: code };
  }
  return {};
}

export async function consumeOtp(identifier: string, channel: OtpChannel, code: string): Promise<boolean> {
  const otp = await prisma.otpCode.findFirst({
    where: { identifier, channel, code, consumed: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) return false;

  await prisma.otpCode.update({ where: { id: otp.id }, data: { consumed: true } });
  return true;
}
