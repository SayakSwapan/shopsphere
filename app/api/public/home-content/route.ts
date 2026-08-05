import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [heroBanners, promoBanners, trustItems, statCounters, categories] =
      await Promise.all([
        prisma.heroBanner.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            eyebrow: true,
            title: true,
            subtitle: true,
            ctaText: true,
            ctaLink: true,
            imageUrl: true,
            badgeNum: true,
            badgeLabel: true,
          },
        }),
        prisma.promoBanner.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            tag: true,
            title: true,
            linkText: true,
            linkUrl: true,
            imageUrl: true,
          },
        }),
        prisma.trustItem.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            icon: true,
            title: true,
            subtitle: true,
          },
        }),
        prisma.statCounter.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            value: true,
            label: true,
          },
        }),
        prisma.category.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            icon: true,
          },
        }),
      ]);

    return NextResponse.json({
      heroBanners,
      promoBanners,
      trustItems,
      statCounters,
      categories,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch home content" },
      { status: 500 }
    );
  }
}
