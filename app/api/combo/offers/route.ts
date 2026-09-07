import { NextResponse } from "next/server";

import { getPublicComboOffers } from "@/lib/combo-checkout";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const offers = await getPublicComboOffers();
    return NextResponse.json({ success: true, offers });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to load offers." }, { status: 500 });
  }
}
