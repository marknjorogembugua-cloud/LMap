import axios from "axios";

/**
 * Email provider abstraction. Defaults to logging to the server console in
 * development. Set EMAIL_PROVIDER=resend with the RESEND_API_KEY /
 * EMAIL_FROM env vars to send real email in production.
 */
export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const provider = process.env.EMAIL_PROVIDER ?? "console";

  if (provider === "resend") {
    await axios.post(
      "https://api.resend.com/emails",
      {
        from: process.env.EMAIL_FROM ?? "LinkMeUp <onboarding@resend.dev>",
        to,
        subject,
        text,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY ?? ""}`,
          "Content-Type": "application/json",
        },
      }
    );
    return;
  }

  // Dev fallback — log so the OTP is visible while testing locally.
  console.log(`[Email -> ${to}] ${subject}: ${text}`);
}
