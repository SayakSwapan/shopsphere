import { cookies } from "next/headers";

const COOKIE_NAME = "admin_token";

export async function setAdminCookie(
  token: string
) {
  const cookieStore =
    await cookies();

  cookieStore.set(
    COOKIE_NAME,
    token,
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge:
        60 * 60 * 24 * 7,
    }
  );
}

export async function removeAdminCookie() {
  const cookieStore =
    await cookies();

  cookieStore.delete(COOKIE_NAME);
}

export async function getAdminCookie() {
  const cookieStore =
    await cookies();

  return cookieStore.get(
    COOKIE_NAME
  )?.value;
}