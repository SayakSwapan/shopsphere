import { getSiteUrl } from "@/lib/seo";
import { getSiteSettings, getSiteName } from "@/lib/site-settings";

export default async function OrganizationJsonLd() {
  const baseUrl = getSiteUrl();
  let settings: Record<string, string> = {};

  try {
    settings = await getSiteSettings();
  } catch {
    // fall through to defaults
  }

  const name = getSiteName(settings);
  const logo = settings.site_logo || undefined;

  const org: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url: baseUrl,
    logo: logo ? { "@type": "ImageObject", url: logo } : undefined,
    sameAs: [
      settings.social_facebook,
      settings.social_instagram,
      settings.social_twitter,
      settings.social_youtube,
    ].filter(Boolean),
  };

  if (settings.contact_email) {
    org.contactPoint = {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: settings.contact_email,
      telephone: settings.contact_phone || undefined,
    };
  }

  if (settings.business_address || settings.gstin) {
    org.address = {
      "@type": "PostalAddress",
      streetAddress: settings.business_address || settings.contact_address || undefined,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(org) }}
    />
  );
}
