const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER;

export async function sendSMS(
  to: string,
  message: string
): Promise<boolean> {
  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) {
    console.error("[SMS] Twilio credentials not set. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER to .env");
    return false;
  }

  const digits = to.replace(/\D/g, "");
  const mobile = digits.length === 10 ? `+91${digits}` : `+${digits}`;

  console.log("[SMS] Sending to:", mobile);

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;

    const body = new URLSearchParams();
    body.append("To", mobile);
    body.append("From", TWILIO_FROM);
    body.append("Body", message);

    const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString("base64");

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const data = await res.json().catch(() => ({}));
    console.log("[SMS] Response:", JSON.stringify(data));

    if (data.sid) {
      console.log("[SMS] Sent! SID:", data.sid);
      return true;
    }

    console.error("[SMS] Failed:", data.message || data);
    return false;
  } catch (err) {
    console.error("[SMS] Exception:", err);
    return false;
  }
}
