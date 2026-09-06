import { getAdminSession } from "@/lib/admin-auth";
import { getLoyaltyProgram, updateLoyaltyProgram } from "@/lib/loyalty";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const program = await getLoyaltyProgram();
    return NextResponse.json({
      success: true,
      badge: {
        badgeName: program.badgeName,
        badgeDescription: program.badgeDescription,
        badgeIcon: program.badgeIcon,
        badgeImage: program.badgeImage,
        badgeBackgroundColor: program.badgeBackgroundColor,
        badgeTextColor: program.badgeTextColor,
        badgeBorderColor: program.badgeBorderColor,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to load badge design" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (typeof body.badgeName === "string") data.badgeName = body.badgeName;
    if (body.badgeDescription !== undefined) data.badgeDescription = body.badgeDescription ?? null;
    if (body.badgeIcon !== undefined) data.badgeIcon = body.badgeIcon ?? null;
    if (body.badgeImage !== undefined) data.badgeImage = body.badgeImage ?? null;
    if (typeof body.badgeBackgroundColor === "string") data.badgeBackgroundColor = body.badgeBackgroundColor;
    if (typeof body.badgeTextColor === "string") data.badgeTextColor = body.badgeTextColor;
    if (typeof body.badgeBorderColor === "string") data.badgeBorderColor = body.badgeBorderColor;

    const program = await updateLoyaltyProgram(data);
    return NextResponse.json({
      success: true,
      badge: {
        badgeName: program.badgeName,
        badgeDescription: program.badgeDescription,
        badgeIcon: program.badgeIcon,
        badgeImage: program.badgeImage,
        badgeBackgroundColor: program.badgeBackgroundColor,
        badgeTextColor: program.badgeTextColor,
        badgeBorderColor: program.badgeBorderColor,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to update badge design" }, { status: 500 });
  }
}