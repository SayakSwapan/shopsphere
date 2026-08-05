import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

interface CreatePartnerInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
  createdById: string;
}

export async function createPartner(
  data: CreatePartnerInput
) {
  const {
    name,
    email,
    phone,
    password,
    createdById,
  } = data;

  const existingUser =
    await prisma.user.findUnique({
      where: {
        email,
      },
    });

  if (existingUser) {
    throw new Error(
      "Email already exists."
    );
  }

  const hashedPassword =
    await bcrypt.hash(password, 10);
    const partner =
    await prisma.$transaction(
      async (tx) => {
        const user =
          await tx.user.create({
            data: {
              name,
              email,
              phone,
              password:
                hashedPassword,

              role: "PARTNER",

              createdById,

              isApproved: false,

              profileCompleted: false,

              approvalStatus:
                "PROFILE_PENDING",
            },
          });

        await tx.partnerProfile.create({
          data: {
            userId: user.id,

            addressLine1: "",

            city: "",

            state: "",

            country: "India",

            pincode: "",
          },
        });

        return user;
      }
    );
    await prisma.activityLog.create({
    data: {
      userId: createdById,

      action: "CREATE",

      module: "Partner",

      entityId: partner.id,

      entityName: partner.name ?? "",

      description: `Created partner ${partner.name ?? ""}`,
    },
  });

  await prisma.notification.create({
    data: {
      title: "Welcome",

      message:
        "Your partner account has been created. Please complete your profile.",

      type: "INFO",

      users: {
        create: {
          userId: partner.id,
        },
      },
    },
  });

  return partner;
}