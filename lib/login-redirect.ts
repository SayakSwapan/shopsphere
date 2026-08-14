const AUTH_PAGES = [
  "/login",
  "/register",
  "/auth/login",
  "/auth/register",
  "/verify-email",
];

export function getLoginRedirect(fallback = "/"): string {
  if (typeof window === "undefined") {
    return fallback;
  }

  const params = new URLSearchParams(window.location.search);
  const fromParam = params.get("redirectTo") || params.get("next");

  if (fromParam && fromParam.startsWith("/") && !fromParam.startsWith("//")) {
    const path = fromParam.split("?")[0];
    if (!AUTH_PAGES.includes(path)) {
      return fromParam;
    }
  }

  const current = window.location.pathname + window.location.search;

  if (AUTH_PAGES.includes(window.location.pathname)) {
    return fallback;
  }

  return current;
}
