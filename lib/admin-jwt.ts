import { SignJWT, jwtVerify } from "jose";

/**
 * Fail closed: without a strong secret, admin tokens would be forgeable
 * (jose would silently sign with the literal string "undefined").
 */
function getSecret(): Uint8Array {
  const value = process.env.JWT_SECRET;

  if (!value || value.length < 32) {
    throw new Error(
      "JWT_SECRET is missing or too weak (must be at least 32 characters)."
    );
  }

  return new TextEncoder().encode(value);
}

export async function createAdminToken(
  id: string
) {
  return await new SignJWT({
    id,
    role: "ADMIN",
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyAdminToken(
  token: string
) {
  try {
    const result = await jwtVerify(
      token,
      getSecret()
    );

    return result.payload;
  } catch {
    return null;
  }
}