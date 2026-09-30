import { redirect } from "next/navigation";
import { headers } from "next/headers";

import AdminShell from "@/components/admin/layout/admin-shell";
import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";
import VisitorAnalytics from "@/components/admin/analytics/visitor-analytics";
import { getAdminSession } from "@/lib/admin-auth";
import { getRequestIp } from "@/lib/request-ip";
import { prisma } from "@/lib/prisma";
import { isPublicIp } from "@/lib/visitor-location";

export const dynamic = "force-dynamic";

function thirtyDaysAgo() {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
}

export default async function AnalyticsPage() {
  const session = await getAdminSession();
  if (!session || session.user.role !== "ADMIN") redirect("/admin/login");

  const adminRequestIp = getRequestIp(await headers());
  const configuredOwnerIps = (process.env.OWNER_IPS ?? "")
    .split(",")
    .map((ip) => ip.trim())
    .filter(isPublicIp);
  const ownerIps = new Set(
    [adminRequestIp, ...configuredOwnerIps].filter(isPublicIp),
  );

  let report: {
    visits: number;
    uniqueVisitors: number;
    returningVisitors: number;
    topDevice: string;
    rows: {
      ipAddress: string;
      visits: number;
      devices: string[];
      city: string | null;
      region: string | null;
      country: string | null;
      countryCode: string | null;
      isOwner: boolean;
      lastVisitAt: string | null;
    }[];
  } | null = null;
  try {
    const where = { createdAt: { gte: thirtyDaysAgo() } };
    const [visits, visitors, ipDeviceGroups] = await Promise.all([
      prisma.visitorSession.count({ where }),
      prisma.visitorSession.groupBy({
        by: ["visitorId"],
        where,
        _count: { _all: true },
      }),
      prisma.visitorSession.groupBy({
        by: ["ipAddress", "deviceType"],
        where,
        _count: { _all: true },
        _max: { lastSeenAt: true },
      }),
    ]);

    const ipRows = new Map<
      string,
      {
        ipAddress: string;
        visits: number;
        devices: Set<string>;
        lastVisitAt: Date | null;
      }
    >();
    const deviceVisits = new Map<string, number>();

    for (const group of ipDeviceGroups) {
      const visitCount = group._count._all;
      const row = ipRows.get(group.ipAddress) ?? {
        ipAddress: group.ipAddress,
        visits: 0,
        devices: new Set<string>(),
        lastVisitAt: null,
      };
      row.visits += visitCount;
      row.devices.add(group.deviceType);
      if (
        group._max.lastSeenAt &&
        (!row.lastVisitAt || group._max.lastSeenAt > row.lastVisitAt)
      ) {
        row.lastVisitAt = group._max.lastSeenAt;
      }
      ipRows.set(group.ipAddress, row);
      deviceVisits.set(
        group.deviceType,
        (deviceVisits.get(group.deviceType) ?? 0) + visitCount,
      );
    }

    const rows = Array.from(ipRows.values())
      .map((row) => ({ ...row, devices: Array.from(row.devices) }))
      .sort((a, b) => b.visits - a.visits);
    const locations = await prisma.visitorSession.findMany({
      where: {
        ipAddress: { in: rows.map((row) => row.ipAddress) },
        locationResolvedAt: { not: null },
      },
      distinct: ["ipAddress"],
      select: {
        ipAddress: true,
        city: true,
        region: true,
        country: true,
        countryCode: true,
      },
    });
    const locationByIp = new Map(
      locations.map(({ ipAddress, city, region, country, countryCode }) => [
        ipAddress,
        { city, region, country, countryCode },
      ]),
    );
    const returningVisitors = visitors.filter(
      (visitor) => visitor._count._all > 1,
    ).length;
    const topDevice = Array.from(deviceVisits.entries()).sort(
      (a, b) => b[1] - a[1],
    )[0];
    report = {
      visits,
      uniqueVisitors: visitors.length,
      returningVisitors,
      topDevice: topDevice?.[0] ?? "unknown",
      rows: rows.map((row) => ({
        ...row,
        ...(locationByIp.get(row.ipAddress) ?? {
          city: null,
          region: null,
          country: null,
          countryCode: null,
        }),
        isOwner: ownerIps.has(row.ipAddress),
        lastVisitAt: row.lastVisitAt?.toISOString() ?? null,
      })),
    };
  } catch {
    report = null;
  }

  if (!report) {
    return (
      <AdminShell
        user={{
          name: session.user.name ?? "Admin",
          email: session.user.email ?? "",
        }}
      >
        <PageContainer>
          <PageHeader
            title="Visitor Analytics"
            subtitle="Rolling 30-day overview"
          />
          <p
            role="alert"
            className="rounded-xl border border-red-900/70 bg-red-950/30 p-4 text-sm text-red-300"
          >
            Visitor analytics could not be loaded. Please try again later.
          </p>
        </PageContainer>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      user={{
        name: session.user.name ?? "Admin",
        email: session.user.email ?? "",
      }}
    >
      <PageContainer>
        <PageHeader
          title="Visitor Analytics"
          subtitle="Rolling 30-day overview"
          description="Visit sessions are grouped by validated IP address and device. Visitor records are retained for up to 90 days."
        />
        <VisitorAnalytics {...report} />
      </PageContainer>
    </AdminShell>
  );
}
