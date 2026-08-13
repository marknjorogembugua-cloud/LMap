import axios from "axios";

/**
 * SMS provider abstraction. Defaults to logging to the server console in
 * development. Set SMS_PROVIDER=africastalking with the AFRICASTALKING_*
 * env vars to send real SMS in production.
 */
export async function sendSms(phone: string, message: string): Promise<void> {
  const provider = process.env.SMS_PROVIDER ?? "console";

  if (provider === "africastalking") {
    const senderId = process.env.AFRICASTALKING_SENDER_ID;
    // Africa's Talking expects E.164 (+254...); our normalized phone is 254... without the +.
    const to = phone.startsWith("+") ? phone : `+${phone}`;
    try {
      await axios.post(
        "https://api.africastalking.com/version1/messaging",
        new URLSearchParams({
          username: process.env.AFRICASTALKING_USERNAME ?? "",
          to,
          message,
          ...(senderId ? { from: senderId } : {}),
        }),
        {
          headers: {
            apiKey: process.env.AFRICASTALKING_API_KEY ?? "",
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
        }
      );
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error(
          `Africa's Talking SMS send failed (${err.response?.status}):`,
          err.response?.data ?? err.message
        );
      }
      throw err;
    }
    return;
  }

  // Dev fallback — log so the OTP is visible while testing locally.
  console.log(`[SMS -> ${phone}] ${message}`);
}
