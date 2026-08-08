import Link from "next/link";
import {
  Truck,
  ShieldCheck,
  BadgeCheck,
  Globe,
  Share2,
  ExternalLink,
  Play,
} from "lucide-react";
import { getSiteSettings } from "@/lib/site-settings";
import { getActiveTheme } from "@/lib/themes/config";
import SiteBrand from "@/components/brand/site-brand";
import SportsFooter from "@/components/store/layout/sports-footer";

export default async function Footer() {
  const [s, activeTheme] = await Promise.all([getSiteSettings(), getActiveTheme()]);

  if (activeTheme === "sports") {
    return <SportsFooter />;
  }

  const siteName = s.site_name || "ShopSphere";
  const tagline = s.footer_tagline || "Premium marketplace for fashion, footwear, accessories and lifestyle products.";
  const copyrightText = s.copyright_text || "All Rights Reserved.";
  const socialLinks = [
    { key: "social_facebook", icon: Globe, label: "Facebook" },
    { key: "social_instagram", icon: Share2, label: "Instagram" },
    { key: "social_twitter", icon: ExternalLink, label: "Twitter" },
    { key: "social_youtube", icon: Play, label: "YouTube" },
  ].filter((l) => s[l.key]);

  return (
    <footer className="border-t border-border-subtle" style={{ background: "var(--t-bg-card)" }}>
      {/* Newsletter */}
      {/* <div className="border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary">Stay Updated</p>
              <h2
                className="mt-3 text-3xl font-black uppercase text-text-heading"
                style={{ fontFamily: "var(--t-font-heading)" }}
              >
                Subscribe to Our Newsletter
              </h2>
              <p className="mt-2 text-text-muted-1 max-w-md">
                Get notified about new arrivals, flash sales and exclusive member offers.
              </p>
            </div>
            <div className="flex w-full max-w-md">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-5 py-3.5 bg-bg-card-nested border border-border-card text-text-heading text-sm placeholder:text-text-muted-2 outline-none focus:border-primary transition-colors"
                style={{ borderRadius: "var(--t-radius-input) 0 0 var(--t-radius-input)" }}
              />
              <button
                className="px-6 py-3.5 bg-primary text-white font-bold text-sm transition-colors flex items-center gap-2 whitespace-nowrap hover:opacity-90"
                style={{ borderRadius: "0 var(--t-radius-button) var(--t-radius-button) 0" }}
              >
                <Send size={16} />
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div> */}

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-10 lg:gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link href="/" className="inline-block">
              <h2
                className="text-2xl font-black text-text-heading"
                style={{ fontFamily: "var(--t-font-heading)" }}
              >
                <SiteBrand name={siteName} />
              </h2>
            </Link>
            <p className="mt-4 text-sm text-text-muted-1 leading-relaxed max-w-xs">
              {tagline}
            </p>
            <div className="mt-4 space-y-2">
              {[
                { label: "About Us", href: "/about" },
                { label: "Contact", href: "/contact" },
                { label: "FAQs", href: "/faqs" },
              ].map((link) => (
                <Link key={link.label} href={link.href} className="block text-sm text-text-muted-1 hover:text-primary transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
            {socialLinks.length > 0 && (
              <div className="flex gap-3 mt-6">
                {socialLinks.map(({ key, icon: Icon, label }) => (
                  <a
                    key={key}
                    href={s[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="h-11 w-11 flex items-center justify-center border border-border-card text-text-muted-1 hover:text-primary hover:border-primary transition-colors"
                    style={{ borderRadius: "var(--t-radius-button)" }}
                  >
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Shop */}
          <div>
            <h3
              className="text-xs font-bold uppercase tracking-wider text-text-heading mb-5"
              style={{ fontFamily: "var(--t-font-heading)" }}
            >
              Shop
            </h3>
            <ul className="space-y-3">
              {[
                { label: "All Products", href: "/products" },
                { label: "New Arrivals", href: "/products" },
                { label: "Trending", href: "/products" },
                { label: "Featured", href: "/products" },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-text-muted-1 hover:text-primary transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer */}
          <div>
            <h3
              className="text-xs font-bold uppercase tracking-wider text-text-heading mb-5"
              style={{ fontFamily: "var(--t-font-heading)" }}
            >
              Customer
            </h3>
            <ul className="space-y-3">
              {[
                { label: "My Account", href: "/account" },
                { label: "Orders", href: "/account/orders" },
                { label: "Wishlist", href: "/wishlist" },
                { label: "Cart", href: "/cart" },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-text-muted-1 hover:text-primary transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3
              className="text-xs font-bold uppercase tracking-wider text-text-heading mb-5"
              style={{ fontFamily: "var(--t-font-heading)" }}
            >
              Support
            </h3>
            <ul className="space-y-3">
              {[
                { label: "About Us", href: "/about" },
                { label: "FAQs", href: "/faqs" },
                { label: "Contact Us", href: "/contact" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms & Conditions", href: "/terms" },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-text-muted-1 hover:text-primary transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 sm:mt-14 sm:pt-10 border-t border-border-subtle">
          {[
            { icon: Truck, title: "Fast Delivery", text: "Pan India delivery support" },
            { icon: ShieldCheck, title: "Secure Payments", text: "100% protected checkout" },
            { icon: BadgeCheck, title: "Genuine Products", text: "100% authentic gear" },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-4 px-6 py-5 bg-bg-card-nested border border-border-card"
              style={{ borderRadius: "var(--t-radius-card)" }}
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center bg-primary/10"
                style={{ borderRadius: "var(--t-radius-card)" }}
              >
                <item.icon size={22} className="text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-heading">{item.title}</h4>
                <p className="text-xs text-text-muted-2 mt-0.5">{item.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-8 border-t border-border-subtle flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-text-muted-2">&copy; {new Date().getFullYear()} {siteName}. {copyrightText}</p>
        </div>
      </div>
    </footer>
  );
}
