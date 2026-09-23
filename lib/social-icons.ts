import {
  FaFacebookF,
  FaInstagram,
  FaLink,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import type { IconType } from "react-icons";

const SOCIAL_ICONS: Record<string, IconType> = {
  facebook: FaFacebookF,
  instagram: FaInstagram,
  x: FaXTwitter,
  twitter: FaXTwitter,
  youtube: FaYoutube,
};

export function getSocialIcon(platform: string): IconType {
  const normalized = platform.trim().toLowerCase().replace(/\s+/g, " ");
  if (normalized === "twitter / x" || normalized === "twitter/x") {
    return FaXTwitter;
  }
  return SOCIAL_ICONS[normalized] || FaLink;
}
