import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export interface PhoneOtpTokenPayload {
  purpose: "phone_login";
  email: string;
}

export function createPhoneOtpToken(email: string): string {
  const payload: PhoneOtpTokenPayload = {
    purpose: "phone_login",
    email,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "10m",
  });
}

export function verifyPhoneOtpToken(
  token: string
): PhoneOtpTokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (
      typeof payload === "object" &&
      payload !== null &&
      (payload as Record<string, unknown>).purpose === "phone_login" &&
      typeof (payload as Record<string, unknown>).email === "string"
    ) {
      return {
        purpose: "phone_login",
        email: (payload as Record<string, unknown>).email as string,
      };
    }

    return null;
  } catch {
    return null;
  }
}
