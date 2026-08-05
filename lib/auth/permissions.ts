import { getCurrentUser } from "@/lib/current-user";

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role !== "ADMIN") {
    throw new Error("Access denied");
  }

  return user;
}

export async function requirePartner() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (
    user.role !== "PARTNER" &&
    user.role !== "ADMIN"
  ) {
    throw new Error("Access denied");
  }

  return user;
}