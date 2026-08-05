import jwt from "jsonwebtoken";
import { AuthUser } from "@/types/auth";

const JWT_SECRET =
  process.env.JWT_SECRET!;

export const generateToken = (
  payload: AuthUser
) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
  });
};

export const verifyToken = (
  token: string
) => {
  return jwt.verify(
    token,
    JWT_SECRET
  ) as AuthUser;
};