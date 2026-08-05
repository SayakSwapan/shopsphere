import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export async function hasPermission(
  permissionName: string
): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  if (user.role === "ADMIN") {
    return true;
  }

  const permission =
    await prisma.userPermission.findFirst({
      where: {
        userId: user.userId,
        permission: {
          name: permissionName,
        },
      },
      include: {
        permission: true,
      },
    });

  return !!permission;
}

export async function requirePermission(
  permissionName: string
) {
  const allowed =
    await hasPermission(permissionName);

  if (!allowed) {
    throw new Error("Permission denied");
  }
}