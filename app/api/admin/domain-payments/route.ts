import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
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

  const payments = await prisma.domainPayment.findMany({
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ success: true, payments });
}

export async function POST(req: Request) {
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

    const body = await req.json();

    if (!body.provider || !body.domain || !body.dueDate) {
      return NextResponse.json(
        { success: false, message: "Provider, domain and due date are required." },
        { status: 400 }
      );
    }

    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      return NextResponse.json(
        { success: false, message: "Amount must be a valid number." },
        { status: 400 }
      );
    }

    const dueDate = new Date(body.dueDate);
    if (Number.isNaN(dueDate.getTime())) {
      return NextResponse.json(
        { success: false, message: "Invalid due date." },
        { status: 400 }
      );
    }

    let paidDate: Date | null = null;
    if (body.paidDate) {
      paidDate = new Date(body.paidDate);
      if (Number.isNaN(paidDate.getTime())) paidDate = null;
    }

    const requestedStatus = body.status === "PAID" ? "PAID" : null;
    const status = requestedStatus ?? (dueDate < new Date() ? "OVERDUE" : "UNPAID");

    const payment = await prisma.domainPayment.create({
      data: {
        provider: String(body.provider).trim(),
        domain: String(body.domain).trim(),
        service: String(body.service || "DOMAIN").toUpperCase(),
        amount,
        currency: String(body.currency || "INR").toUpperCase(),
        paymentMethod: body.paymentMethod || null,
        dueDate,
        paidDate: requestedStatus ? (paidDate ?? new Date()) : null,
        status,
        autoRenew: Boolean(body.autoRenew),
        notes: body.notes || null,
      },
    });

    return NextResponse.json({ success: true, payment }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to create payment." }, { status: 500 });
  }
}
