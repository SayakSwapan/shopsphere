import { getAdminSession } from "@/lib/admin-auth";
import { getActiveTheme, setActiveTheme, themeList, themes, type ThemeId } from "@/lib/themes/config";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const active = await getActiveTheme();
    return NextResponse.json({
      success: true,
      data: { active, themes: themeList },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { themeId } = body;

    if (!themeId || !(themeId in themes)) {
      return NextResponse.json({ success: false, message: "Invalid theme ID." }, { status: 400 });
    }

    await setActiveTheme(themeId as ThemeId);

    return NextResponse.json({
      success: true,
      message: `Theme changed to "${themes[themeId as ThemeId].name}".`,
      data: { active: themeId },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to update theme." }, { status: 500 });
  }
}
