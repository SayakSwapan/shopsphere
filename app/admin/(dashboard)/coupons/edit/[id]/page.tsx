import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

import CouponForm from "@/components/admin/coupons/coupons-form";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditCouponPage({
  params,
}: Props) {
  const { id } = await params;

  const coupon = await prisma.coupon.findUnique({
    where: {
      id,
    },
  });

  if (!coupon) {
    notFound();
  }

  return (
    <CouponForm
      initialData={{
        id: coupon.id,
        code: coupon.code,
        title: coupon.title,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        maxDiscount: coupon.maxDiscount
          ? Number(coupon.maxDiscount)
          : null,
        minimumOrder: coupon.minimumOrder
          ? Number(coupon.minimumOrder)
          : null,
        usageLimit: coupon.usageLimit,
        perUserLimit: coupon.perUserLimit,
        firstOrderOnly: coupon.firstOrderOnly,
        isActive: coupon.isActive,
        startDate: coupon.startDate.toISOString(),
        endDate: coupon.endDate.toISOString(),
      }}
    />
  );
}