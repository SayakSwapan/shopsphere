import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { TtlCache } from "@/lib/ttl-cache";
import { FooterLink, SocialLink } from "@prisma/client";

const footerLinksCache = new TtlCache<Record<string, FooterLink[]>>(120_000);
const socialLinksCache = new TtlCache<SocialLink[]>(120_000);

/**
 * Active footer link rows grouped by column, cached for 2 minutes (footer
 * links change rarely and are rendered on every page). React `cache()`
 * additionally dedupes repeated calls within a single render.
 */
export const getFooterLinksGrouped = cache(
  async (): Promise<Record<string, FooterLink[]>> => {
    return footerLinksCache.get(async () => {
      try {
        const links = await prisma.footerLink.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        });
        const grouped: Record<string, FooterLink[]> = {};
        for (const link of links) {
          if (!grouped[link.group]) grouped[link.group] = [];
          grouped[link.group].push(link);
        }
        return grouped;
      } catch {
        return {};
      }
    });
  },
);

/** Active social links, cached like the footer links. */
export const getSocialLinks = cache(async (): Promise<SocialLink[]> => {
  return socialLinksCache.get(async () => {
    try {
      const links = await prisma.socialLink.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      });
      return links.filter((link) => link.url.trim().length > 0);
    } catch {
      return [];
    }
  });
});

export function invalidateSocialLinksCache(): void {
  socialLinksCache.clear();
}
