import { prisma } from "@/lib/prisma";
import Image from "next/image";
import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";
import WishlistDetailClient from "@/components/admin/wishlists/wishlist-detail-client";

export default async function WishlistDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      productimage: { take: 1 },
      category: { select: { name: true } },
    },
  });

  if (!product) {
    return (
      <PageContainer>
        <PageHeader title="Product Not Found" subtitle="The requested product does not exist." />
      </PageContainer>
    );
  }

  const wishlistItems = await prisma.wishlistitem.findMany({
    where: { productId },
    include: {
      wishlist: {
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const customers = wishlistItems
    .map((item) => ({
      userId: item.wishlist?.user?.id ?? "",
      name: item.wishlist?.user?.name ?? null,
      email: item.wishlist?.user?.email ?? "",
      phone: item.wishlist?.user?.phone ?? null,
      wishlistedAt: item.createdAt.toISOString(),
    }))
    .filter((c) => !!c.userId);

  const availableCoupons = await prisma.coupon.findMany({
    where: { isActive: true, endDate: { gte: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  const sentLogs = await prisma.wishlistCouponLog.findMany({
    where: { productId },
    include: {
      coupon: { select: { code: true, title: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { sentAt: "desc" },
  });

  return (
    <PageContainer>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-xl shrink-0">
            <Image
              src={product.productimage?.[0]?.url || "/placeholder.png"}
              fill
              alt={product.name}
              className="object-cover"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{product.name}</h1>
            <p className="text-sm text-slate-400">
              ₹{Number(product.sellingPrice).toFixed(2)} · {product.category?.name || "No category"} · {customers.length} wishlisted
            </p>
          </div>
        </div>
      </div>

      <WishlistDetailClient
        productId={productId}
        product={{
          name: product.name,
          sellingPrice: Number(product.sellingPrice),
          salePrice: Number(product.salePrice || 0),
          finalPrice: Number(product.finalPrice || product.sellingPrice || 0),
          costPrice: Number(product.costPrice || 0),
        }}
        customers={customers}
        availableCoupons={availableCoupons.map((c) => ({
          id: c.id,
          code: c.code,
          title: c.title,
          discountType: c.discountType,
          discountValue: Number(c.discountValue),
          maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : null,
          minOrder: c.minimumOrder ? Number(c.minimumOrder) : null,
          productId: c.productId,
          endDate: c.endDate.toISOString(),
        }))}
        sentLogs={sentLogs.map((l) => ({
          id: l.id,
          couponId: l.couponId,
          couponCode: l.coupon.code,
          couponTitle: l.coupon.title,
          userId: l.user.id,
          userName: l.user.name || "—",
          userEmail: l.user.email,
          sentAt: l.sentAt.toISOString(),
        }))}
      />
    </PageContainer>
  );
}
