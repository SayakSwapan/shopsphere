import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET!
);

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
    .sign(secret);
}

export async function verifyAdminToken(
  token: string
) {
  try {
    const result = await jwtVerify(
      token,
      secret
    );

    return result.payload;
  } catch {
    return null;
  }
}