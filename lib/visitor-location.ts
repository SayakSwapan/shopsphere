import { isIP } from "node:net";

export interface VisitorLocation {
  city: string | null;
  region: string | null;
  country: string | null;
  countryCode: string | null;
}

interface IpWhoResponse {
  success?: boolean;
  city?: string;
  region?: string;
  country?: string;
  country_code?: string;
}

const inFlightLookups = new Map<string, Promise<VisitorLocation>>();

export function isPublicIp(ip: string): boolean {
  const version = isIP(ip);
  if (!version) return false;

  if (version === 4) {
    const [first, second, third] = ip.split(".").map(Number);
    return !(
      first === 0 ||
      first === 10 ||
      first === 127 ||
      first >= 224 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 0 && (third === 0 || third === 2)) ||
      (first === 192 && second === 168) ||
      (first === 192 && second === 88 && third === 99) ||
      (first === 198 && (second === 18 || second === 19)) ||
      (first === 198 && second === 51 && third === 100) ||
      (first === 203 && second === 0 && third === 113)
    );
  }

  const normalized = ip.toLowerCase();
  const firstGroup = Number.parseInt(normalized.split(":")[0] || "0", 16);
  return !(
    firstGroup === 0 ||
    (firstGroup & 0xfe00) === 0xfc00 ||
    (firstGroup & 0xffc0) === 0xfe80 ||
    (firstGroup & 0xff00) === 0xff00 ||
    normalized.startsWith("2001:db8:")
  );
}

async function fetchLocation(ip: string): Promise<VisitorLocation> {
  const empty: VisitorLocation = {
    city: null,
    region: null,
    country: null,
    countryCode: null,
  };

  if (!isPublicIp(ip)) return empty;

  try {
    const response = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) return empty;

    const data = (await response.json()) as IpWhoResponse;
    if (data.success !== true) return empty;

    return {
      city: data.city?.trim().slice(0, 128) || null,
      region: data.region?.trim().slice(0, 128) || null,
      country: data.country?.trim().slice(0, 128) || null,
      countryCode: data.country_code?.trim().slice(0, 2).toUpperCase() || null,
    };
  } catch {
    return empty;
  }
}

export function lookupVisitorLocation(ip: string): Promise<VisitorLocation> {
  const currentLookup = inFlightLookups.get(ip);
  if (currentLookup) return currentLookup;

  const lookup = fetchLocation(ip).finally(() => {
    inFlightLookups.delete(ip);
  });
  inFlightLookups.set(ip, lookup);
  return lookup;
}
