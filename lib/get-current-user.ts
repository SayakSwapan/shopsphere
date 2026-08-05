import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

import { verifyToken } from "./jwt";

export async function getCurrentUser() {
  try {
    const cookieStore =
      await cookies();

    const token =
      cookieStore.get(
        "token"
      )?.value;

    if (!token)
      return null;

    const payload =
      verifyToken(
        token
      ) as {
        userId: string;
      };

    return prisma.user.findUnique(
      {
        where: {
          id: payload.userId,
        },
      }
    );
  } catch {
    return null;
  }
}