import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.domainPayment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Not found." }, { status: 404 });
    }

    const data: {
      provider?: string;
      domain?: string;
      service?: string;
      amount?: number;
      currency?: string;
      paymentMethod?: string | null;
      dueDate?: Date;
      paidDate?: Date | null;
      status?: string;
      autoRenew?: boolean;
      notes?: string | null;
    } = {};

    if (body.provider !== undefined) data.provider = String(body.provider).trim();
    if (body.domain !== undefined) data.domain = String(body.domain).trim();
    if (body.service !== undefined) data.service = String(body.service || "DOMAIN").toUpperCase();
    if (body.currency !== undefined) data.currency = String(body.currency || "INR").toUpperCase();
    if (body.autoRenew !== undefined) data.autoRenew = Boolean(body.autoRenew);
    if (body.notes !== undefined) data.notes = body.notes || null;
    if (body.paymentMethod !== undefined) data.paymentMethod = body.paymentMethod || null;

    if (body.amount !== undefined) {
      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount < 0) {
        return NextResponse.json({ success: false, message: "Amount must be a valid number." }, { status: 400 });
      }
      data.amount = amount;
    }

    if (body.dueDate !== undefined) {
      const dueDate = new Date(body.dueDate);
      if (Number.isNaN(dueDate.getTime())) {
        return NextResponse.json({ success: false, message: "Invalid due date." }, { status: 400 });
      }
      data.dueDate = dueDate;
    }

    if (body.paidDate !== undefined && body.paidDate !== null) {
      const paidDate = new Date(body.paidDate);
      if (Number.isNaN(paidDate.getTime())) {
        return NextResponse.json({ success: false, message: "Invalid paid date." }, { status: 400 });
      }
      data.paidDate = paidDate;
    } else if (body.paidDate === null) {
      data.paidDate = null;
    }

    if (body.status !== undefined) {
      data.status = String(body.status).toUpperCase();
    }

    if (data.status === "PAID" && data.paidDate === undefined) {
      data.paidDate = new Date();
    }
    if (data.status === "UNPAID" || data.status === "OVERDUE") {
      data.paidDate = null;
    }

    const payment = await prisma.domainPayment.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, payment });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to update payment." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await params;
    await prisma.domainPayment.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to delete payment." }, { status: 500 });
  }
}
