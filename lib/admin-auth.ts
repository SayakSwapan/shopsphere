import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

import { createAdminToken, verifyAdminToken } from "./admin-jwt";

import { getAdminCookie, setAdminCookie } from "./admin-cookie";

export async function getAdminSession() {
  const token = await getAdminCookie();

  if (!token) return null;

  const payload = await verifyAdminToken(token);

  if (!payload || payload.role !== "ADMIN") return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.id as string },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user || user.role !== "ADMIN") return null;

  return { user };
}

export async function adminLogin(
  email: string,
  password: string
) {
  const admin =
    await prisma.user.findUnique({
      where: {
        email,
      },
    });

  if (!admin)
    return {
      success: false,
    };

  if (admin.role !== "ADMIN")
    return {
      success: false,
    };

  if (!admin.password)
    return {
      success: false,
    };

  const valid =
    await bcrypt.compare(
      password,
      admin.password
    );

  if (!valid)
    return {
      success: false,
    };

  const token =
    await createAdminToken(
      admin.id
    );

  await setAdminCookie(token);

  return {
    success: true,
  };
}