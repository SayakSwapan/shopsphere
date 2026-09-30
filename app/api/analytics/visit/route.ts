import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getRequestIp } from "@/lib/request-ip";
import { rateLimit } from "@/lib/security";
import { isPublicIp, lookupVisitorLocation } from "@/lib/visitor-location";

const VISITOR_COOKIE = "visitor_id";
const SESSION_COOKIE = "visitor_session";
const VISITOR_MAX_AGE = 60 * 60 * 24 * 365;
const SESSION_MAX_AGE = 60 * 30;
const RETENTION_DAYS = 90;
const UUID_PATTERN =
  /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

let lastPrunedAt = 0;

function getDeviceType(request: NextRequest): string {
  const clientDevice = request.headers.get("x-visitor-device");
  if (["mobile", "tablet", "desktop"].includes(clientDevice ?? "")) {
    return clientDevice!;
  }

  const userAgent = request.headers.get("user-agent") ?? "";
  if (/ipad|tablet|kindle|silk|playbook|android(?!.*mobile)/i.test(userAgent)) {
    return "tablet";
  }
  if (/mobile|iphone|ipod|android|windows phone/i.test(userAgent)) {
    return "mobile";
  }
  return "desktop";
}

function validCookieId(value: string | undefined): value is string {
  return Boolean(value && UUID_PATTERN.test(value));
}

export async function POST(request: NextRequest) {
  const ipAddress = getRequestIp(request.headers);
  const limit = rateLimit(
    `visitor-analytics:${ipAddress}`,
    120,
    10 * 60 * 1000,
  );
  if (!limit.ok) {
    return new NextResponse(null, { status: 429 });
  }

  const now = Date.now();
  if (now - lastPrunedAt > 24 * 60 * 60 * 1000) {
    lastPrunedAt = now;
    try {
      await prisma.visitorSession.deleteMany({
        where: {
          createdAt: {
            lt: new Date(now - RETENTION_DAYS * 24 * 60 * 60 * 1000),
          },
        },
      });
    } catch {
      // Keep the daily throttle even if pruning fails; the next scheduled pass retries.
    }
  }

  const cookieVisitorId = request.cookies.get(VISITOR_COOKIE)?.value;
  const cookieSessionId = request.cookies.get(SESSION_COOKIE)?.value;
  const visitorId = validCookieId(cookieVisitorId)
    ? cookieVisitorId
    : randomUUID();
  const sessionId = validCookieId(cookieSessionId)
    ? cookieSessionId
    : randomUUID();

  try {
    await prisma.visitorSession.upsert({
      where: { id: sessionId },
      create: {
        id: sessionId,
        visitorId,
        ipAddress,
        deviceType: getDeviceType(request),
      },
      update: {
        visitorId,
        ipAddress,
        deviceType: getDeviceType(request),
        lastSeenAt: new Date(now),
      },
    });
  } catch {
    return new NextResponse(null, { status: 503 });
  }

  if (isPublicIp(ipAddress)) {
    try {
      const locationCacheMaxAge = 30 * 24 * 60 * 60 * 1000;
      const cachedLocation = await prisma.visitorSession.findFirst({
        where: {
          ipAddress,
          locationResolvedAt: {
            gte: new Date(now - locationCacheMaxAge),
          },
        },
        orderBy: { locationResolvedAt: "desc" },
        select: {
          city: true,
          region: true,
          country: true,
          countryCode: true,
          locationResolvedAt: true,
        },
      });

      const location = cachedLocation ?? {
        ...(await lookupVisitorLocation(ipAddress)),
        locationResolvedAt: new Date(now),
      };
      await prisma.visitorSession.updateMany({
        where: { ipAddress },
        data: location,
      });
    } catch {
      // Visitor recording must remain available when enrichment or its cache fails.
    }
  }

  const response = new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };

  if (!validCookieId(cookieVisitorId)) {
    response.cookies.set(VISITOR_COOKIE, visitorId, {
      ...cookieOptions,
      maxAge: VISITOR_MAX_AGE,
    });
  }
  response.cookies.set(SESSION_COOKIE, sessionId, {
    ...cookieOptions,
    maxAge: SESSION_MAX_AGE,
  });

  return response;
}
