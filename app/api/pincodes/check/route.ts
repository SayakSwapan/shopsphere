import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get("pincode");

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return NextResponse.json(
        { success: false, message: "Valid 6-digit pincode is required." },
        { status: 400 }
      );
    }

    const record = await prisma.pincode.findUnique({
      where: { pincode },
      select: {
        isDeliverable: true,
        estimatedDays: true,
        allowCod: true,
        allowOnline: true,
      },
    });

    if (!record) {
      return NextResponse.json({
        success: true,
        deliverable: false,
        estimatedDays: 0,
        allowCod: false,
        allowOnline: false,
        restrictedProducts: [],
        message: "Pincode not found. Delivery not available.",
      });
    }

    // Optional: per-product deliverability. When productIds is supplied, we
    // report which of those products are explicitly restricted from this
    // pincode (e.g. the checkout cart or the product-page checker).
    const productIdsParam = searchParams.get("productIds");
    const productIds = productIdsParam
      ? productIdsParam
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    let restrictedProducts: { productId: string; productName: string }[] = [];

    if (productIds.length > 0 && record.isDeliverable) {
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          name: true,
          restrictedPincodes: true,
        },
      });

      restrictedProducts = products
        .filter((p) => p.restrictedPincodes.includes(pincode))
        .map((p) => ({ productId: p.id, productName: p.name }));
    }

    return NextResponse.json({
      success: true,
      deliverable: record.isDeliverable,
      estimatedDays: record.estimatedDays,
      allowCod: record.allowCod,
      allowOnline: record.allowOnline,
      restrictedProducts,
      message: record.isDeliverable
        ? restrictedProducts.length > 0
          ? "Some products are not deliverable to this pincode."
          : `Delivery in ${record.estimatedDays} business day${record.estimatedDays > 1 ? "s" : ""}`
        : "Delivery not available for this pincode.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Something went wrong." },
      { status: 500 }
    );
  }
}
