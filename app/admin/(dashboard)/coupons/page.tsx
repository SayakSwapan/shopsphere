import Link from "next/link";
import { prisma } from "@/lib/prisma";

import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";
import CouponsTable from "@/components/admin/coupons/coupons-table";

export default async function CouponsPage() {
  let coupons;
  try {
    coupons = await prisma.coupon.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Coupons" subtitle="Manage coupons" />
        <p className="text-red-400">Failed to load coupons. Please try again later.</p>
      </PageContainer>
    );
  }

  const rows = coupons.map((coupon) => ({
    ...coupon,
    discountValue: Number(coupon.discountValue),
    maxDiscount: coupon.maxDiscount
      ? Number(coupon.maxDiscount)
      : null,
    minimumOrder: coupon.minimumOrder
      ? Number(coupon.minimumOrder)
      : null,
  }));

  return (
    <PageContainer>
      <PageHeader
        title="Coupons"
        subtitle={`${rows.length} Coupons`}
        description="Create and manage discount coupons. Set percentage or flat discounts, expiry dates, and usage limits."
      />

      <div className="mb-6 flex justify-end">
        <Link
          href="/admin/coupons/new"
          className="rounded-xl bg-amber-500 px-5 py-3 font-semibold text-black hover:bg-amber-400"
        >
          + Create Coupon
        </Link>
      </div>

      <CouponsTable coupons={rows} />
    </PageContainer>
  );
}