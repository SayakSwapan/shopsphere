import { getActiveTheme, themes } from "@/lib/themes/config";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const activeTheme = await getActiveTheme();
    return NextResponse.json({
      success: true,
      data: {
        active: activeTheme,
        tokens: themes[activeTheme],
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to load theme." }, { status: 500 });
  }
}
