import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";
import { sendTemplatedEmail } from "@/lib/email-service";

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { couponId, productId, userId } = await req.json();

    if (!couponId || !productId) {
      return NextResponse.json(
        { success: false, message: "couponId and productId are required" },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) {
      return NextResponse.json({ success: false, message: "Coupon not found" }, { status: 404 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { productimage: { take: 1 } },
    });
    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    const wishlistItems = await prisma.wishlistitem.findMany({
      where: { productId },
      include: {
        wishlist: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    let users = wishlistItems
      .map((item) => item.wishlist?.user)
      .filter((u): u is { id: string; name: string | null; email: string } => !!u);

    if (userId) {
      users = users.filter((u) => u.id === userId);
      if (users.length === 0) {
        return NextResponse.json(
          { success: false, message: "User does not have this product in their wishlist" },
          { status: 404 }
        );
      }
    }

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: "No customers have this product in their wishlist" },
        { status: 400 }
      );
    }

    const alreadySent = await prisma.wishlistCouponLog.findMany({
      where: {
        couponId,
        productId,
        userId: { in: users.map((u) => u.id) },
      },
      select: { userId: true },
    });

    const sentUserIds = new Set(alreadySent.map((l) => l.userId));
    const recipients = users.filter((u) => !sentUserIds.has(u.id));

    if (recipients.length === 0) {
      return NextResponse.json(
        { success: false, message: "All eligible customers have already received this coupon" },
        { status: 400 }
      );
    }

    let successCount = 0;
    let failCount = 0;

    const productImage = product.productimage?.[0]?.url || "";

    for (const user of recipients) {
      try {
        const sent = await sendTemplatedEmail({
          to: user.email,
          templateKey: "wishlist_coupon",
          placeholders: {
            customerName: user.name || "Valued Customer",
            productName: product.name,
            productImage,
            productUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://shopsphere.com"}/products/${product.slug}`,
            couponCode: coupon.code,
            couponTitle: coupon.title,
            discountType: coupon.discountType === "FLAT" ? `Flat ₹${coupon.discountValue}` : `${coupon.discountValue}% Off`,
            maxDiscount: coupon.maxDiscount ? `Up to ₹${coupon.maxDiscount}` : "",
            expiryDate: coupon.endDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
            currentYear: String(new Date().getFullYear()),
          },
          fallbackSubject: `Exclusive Offer on ${product.name} — Use Code ${coupon.code}`,
          fallbackBody: `<div style="background:#0A0F1E;color:#ffffff;padding:48px 40px;font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;">
<h1 style="color:#F5A623;font-size:28px;margin:0 0 8px 0;">{{siteName}}</h1>
<p style="color:#8892A4;font-size:13px;margin:0 0 32px 0;">Exclusive Wishlist Offer</p>
<div style="background:#111827;border-radius:16px;padding:36px 32px;">
<p style="color:#8892A4;font-size:11px;text-transform:uppercase;letter-spacing:3px;margin:0 0 12px 0;">Special Offer For You</p>
<h2 style="color:#ffffff;font-size:22px;margin:0 0 8px 0;">Hello, ${user.name || "Valued Customer"}</h2>
<p style="color:#8892A4;font-size:14px;line-height:1.7;margin:0 0 24px 0;">We noticed you have <strong style="color:#F5A623;">${product.name}</strong> in your wishlist. Here's an exclusive offer just for you!</p>
<div style="background:rgba(245,166,35,0.06);border:1px solid rgba(245,166,35,0.2);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
<p style="color:#8892A4;font-size:11px;text-transform:uppercase;letter-spacing:3px;margin:0 0 8px 0;">Your Coupon Code</p>
<h3 style="color:#F5A623;font-size:28px;letter-spacing:4px;margin:0 0 8px 0;font-family:monospace;">${coupon.code}</h3>
<p style="color:#CBD5E1;font-size:14px;margin:0;">${coupon.discountType === "FLAT" ? `Flat ₹${coupon.discountValue} Off` : `${coupon.discountValue}% Off`}${coupon.maxDiscount ? ` (Up to ₹${coupon.maxDiscount})` : ""}</p>
</div>
<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:24px;">
<p style="color:#F5A623;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px 0;">How to Use</p>
<ol style="color:#CBD5E1;font-size:13px;line-height:2;margin:0;padding-left:20px;">
<li>Click the link below to view the product</li>
<li>Add the product to your cart</li>
<li>Apply coupon code <strong style="color:#F5A623;">${coupon.code}</strong> at checkout</li>
<li>Enjoy your exclusive discount!</li>
</ol>
</div>
<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px;margin-bottom:24px;">
<p style="color:#8892A4;font-size:11px;margin:0;"><strong style="color:#CBD5E1;">Important:</strong> This coupon is valid only for <strong style="color:#F5A623;">${product.name}</strong>. It cannot be used for other products. Valid until <strong style="color:#CBD5E1;">${coupon.endDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong>.</p>
</div>
<div style="text-align:center;">
<a href="${process.env.NEXT_PUBLIC_APP_URL || "https://shopsphere.com"}/products/${product.slug}" style="display:inline-block;background:#F5A623;color:#0A0F1E;font-weight:bold;padding:14px 36px;border-radius:12px;text-decoration:none;font-size:14px;">View Product &amp; Buy Now</a>
</div>
</div>
<p style="color:#3A4455;font-size:11px;margin-top:32px;text-align:center;">&copy; ${new Date().getFullYear()} {{siteName}}. All rights reserved.</p>
</div>`,
        });

        if (sent) {
          await prisma.wishlistCouponLog.create({
            data: { couponId, userId: user.id, productId },
          });
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Coupon sent to ${successCount} customer(s).${failCount > 0 ? ` ${failCount} failed.` : ""}`,
      sent: successCount,
      failed: failCount,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to send coupons" }, { status: 500 });
  }
}
