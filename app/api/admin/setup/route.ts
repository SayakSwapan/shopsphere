import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createAdminToken } from "@/lib/admin-jwt";
import { setAdminCookie } from "@/lib/admin-cookie";

export async function POST(req: Request) {
  try {
    const adminCount = await prisma.user.count({
      where: { role: "ADMIN" },
    });

    if (adminCount > 0) {
      return NextResponse.json(
        { success: false, message: "Admin already exists. Setup is disabled." },
        { status: 403 }
      );
    }

    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      if (existingUser.role === "ADMIN") {
        return NextResponse.json(
          { success: false, message: "An admin with this email already exists." },
          { status: 409 }
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: name.trim(),
          password: hashedPassword,
          role: "ADMIN",
          isActive: true,
          isVerified: true,
          emailVerified: true,
        },
      });

      const token = await createAdminToken(existingUser.id);
      await setAdminCookie(token);

      return NextResponse.json({ success: true });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
        isVerified: true,
        emailVerified: true,
      },
    });

    const token = await createAdminToken(user.id);
    await setAdminCookie(token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin setup failed:", error);
    return NextResponse.json(
      { success: false, message: "Setup failed. Please try again." },
      { status: 500 }
    );
  }
}
