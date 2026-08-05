import bcrypt from "bcryptjs";
import otpGenerator from "otp-generator";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth.validation";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { message: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, phone, password } = result.data;

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return Response.json({ message: "Email already exists" }, { status: 400 });
    }

    if (phone) {
      const existingPhone = await prisma.user.findFirst({ where: { phone } });
      if (existingPhone) {
        return Response.json({ message: "Phone number already exists" }, { status: 400 });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });

    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.create({
      data: {
        name,
        email,
        phone: phone === "" ? null : phone,
        password: hashedPassword,
        role: "CUSTOMER",
        isVerified: false,
        emailVerified: false,
        phoneVerified: false,
        isActive: true,
        emailOtp: otp,
        emailOtpExpiry: otpExpiry,
      },
    });

    return Response.json({
      success: true,
      message: "Account created. Please verify your email.",
      email,
      requiresVerification: true,
    });
  } catch (error) {
    console.log(error);
    return Response.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
