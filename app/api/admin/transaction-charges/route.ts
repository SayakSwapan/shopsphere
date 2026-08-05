import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const charges = await prisma.transactionCharge.findMany({
      orderBy: [{ sortOrder: "asc" }, { minAmount: "asc" }],
    });

    return NextResponse.json({ success: true, charges });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { minAmount, maxAmount, feeType, feeValue, isActive, sortOrder, description, minFee, maxFee, gstOnFee, effectiveDate, expiryDate, priority, gateway, paymentMethod } = await req.json();

    if (minAmount === undefined || feeValue === undefined) {
      return NextResponse.json({ success: false, message: "minAmount and feeValue are required" }, { status: 400 });
    }

    const charge = await prisma.transactionCharge.create({
      data: {
        minAmount: Number(minAmount),
        maxAmount: maxAmount ? Number(maxAmount) : null,
        feeType: feeType || "FLAT",
        feeValue: Number(feeValue),
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
        description: description || null,
        minFee: minFee != null ? Number(minFee) : null,
        maxFee: maxFee != null ? Number(maxFee) : null,
        gstOnFee: gstOnFee ?? false,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        priority: priority ?? 0,
        gateway: gateway || null,
        paymentMethod: paymentMethod || null,
      },
    });

    return NextResponse.json({ success: true, charge });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to create" }, { status: 500 });
  }
}
