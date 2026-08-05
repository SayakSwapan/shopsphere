import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { minAmount, maxAmount, feeType, feeValue, isActive, sortOrder, description, minFee, maxFee, gstOnFee, effectiveDate, expiryDate, priority, gateway, paymentMethod } = await req.json();

    const charge = await prisma.transactionCharge.update({
      where: { id },
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
    return NextResponse.json({ success: false, message: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.transactionCharge.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to delete" }, { status: 500 });
  }
}
