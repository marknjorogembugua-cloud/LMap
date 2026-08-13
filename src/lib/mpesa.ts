import axios from "axios";

const BASE_URL =
  process.env.MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;

  const key = process.env.MPESA_CONSUMER_KEY ?? "";
  const secret = process.env.MPESA_CONSUMER_SECRET ?? "";
  const auth = Buffer.from(`${key}:${secret}`).toString("base64");

  const { data } = await axios.get(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });

  cachedToken = {
    token: data.access_token,
    // refresh a minute before actual expiry
    expiresAt: Date.now() + (Number(data.expires_in) - 60) * 1000,
  };
  return cachedToken.token;
}

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(
    d.getMinutes()
  )}${pad(d.getSeconds())}`;
}

export type StkPushResult = {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
};

/**
 * Initiates an M-Pesa STK Push (Lipa na M-Pesa Online) prompt on the payer's
 * phone. `phone` must be normalized to 2547xxxxxxxx / 2541xxxxxxxx.
 */
export async function stkPush(params: {
  phone: string;
  amountKes: number;
  accountReference: string;
  description: string;
}): Promise<StkPushResult> {
  const shortcode = process.env.MPESA_SHORTCODE ?? "174379";
  const passkey = process.env.MPESA_PASSKEY ?? "";
  const ts = timestamp();
  const password = Buffer.from(`${shortcode}${passkey}${ts}`).toString("base64");
  const token = await getAccessToken();

  const { data } = await axios.post(
    `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
    {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: ts,
      TransactionType: "CustomerPayBillOnline",
      Amount: params.amountKes,
      PartyA: params.phone,
      PartyB: shortcode,
      PhoneNumber: params.phone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: params.accountReference,
      TransactionDesc: params.description,
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return data as StkPushResult;
}

export type MpesaCallbackBody = {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: { Name: string; Value?: string | number }[];
      };
    };
  };
};

export function parseStkCallback(body: MpesaCallbackBody) {
  const cb = body.Body.stkCallback;
  const items = cb.CallbackMetadata?.Item ?? [];
  const find = (name: string) => items.find((i) => i.Name === name)?.Value;

  return {
    merchantRequestId: cb.MerchantRequestID,
    checkoutRequestId: cb.CheckoutRequestID,
    success: cb.ResultCode === 0,
    resultDesc: cb.ResultDesc,
    amount: find("Amount") as number | undefined,
    mpesaReceiptNumber: find("MpesaReceiptNumber") as string | undefined,
    phoneNumber: find("PhoneNumber") as string | undefined,
  };
}
