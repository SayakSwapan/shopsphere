import jwt from "jsonwebtoken";
import { AuthUser } from "@/types/auth";

/**
 * Fail closed: without a strong secret, tokens would be forgeable
 * (jsonwebtoken would silently sign with the literal string "undefined").
 */
function getSecret(): string {
  const value = process.env.JWT_SECRET;

  if (!value || value.length < 32) {
    throw new Error(
      "JWT_SECRET is missing or too weak (must be at least 32 characters)."
    );
  }

  return value;
}

export const generateToken = (
  payload: AuthUser
) => {
  return jwt.sign(payload, getSecret(), {
    expiresIn: "7d",
  });
};

export const verifyToken = (
  token: string
) => {
  return jwt.verify(
    token,
    getSecret()
  ) as AuthUser;
};
