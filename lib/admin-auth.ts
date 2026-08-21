import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

import { createAdminToken, verifyAdminToken } from "./admin-jwt";

import { getAdminCookie, setAdminCookie } from "./admin-cookie";

const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

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
  password: string,
  meta?: { ip?: string; userAgent?: string }
) {
  const normalizedEmail = email.toLowerCase().trim();

  // Brute-force protection: lock the account after too many recent failures.
  const recentFailed = await prisma.loginAttempt.count({
    where: {
      email: normalizedEmail,
      success: false,
      createdAt: { gte: new Date(Date.now() - LOCKOUT_WINDOW_MS) },
    },
  });

  if (recentFailed >= MAX_FAILED_ATTEMPTS) {
    return {
      success: false,
      locked: true,
    };
  }

  const recordFailure = () =>
    prisma.loginAttempt
      .create({
        data: {
          email: normalizedEmail,
          success: false,
          ipAddress: meta?.ip ?? null,
          userAgent: meta?.userAgent ?? null,
        },
      })
      .catch(() => {});

  const admin =
    await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

  if (!admin || admin.role !== "ADMIN" || !admin.password) {
    await recordFailure();
    return {
      success: false,
    };
  }

  const valid =
    await bcrypt.compare(
      password,
      admin.password
    );

  if (!valid) {
    await recordFailure();
    return {
      success: false,
    };
  }

  await prisma.loginAttempt
    .create({
      data: {
        email: normalizedEmail,
        success: true,
        ipAddress: meta?.ip ?? null,
        userAgent: meta?.userAgent ?? null,
      },
    })
    .catch(() => {});

  const token =
    await createAdminToken(
      admin.id
    );

  await setAdminCookie(token);

  return {
    success: true,
  };
}
