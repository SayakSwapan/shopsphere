import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

export async function getCurrentUser() {
  try {
    const cookieStore =
      await cookies();

    const token =
      cookieStore.get("token")?.value;

    if (!token) {
      return null;
    }

    const decoded = verifyToken(
      token
    ) as {
      userId: string;
      role: string;
    };

    return decoded;
  } catch {
    return null;
  }
}