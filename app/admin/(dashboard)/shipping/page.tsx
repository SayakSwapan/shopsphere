import Link from "next/link";

import { prisma } from "@/lib/prisma";

import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";
import ShippingTable from "@/components/admin/shipping/shipping-table";

export default async function ShippingPage() {
  let rules;
  try {
    rules = await prisma.shippingRule.findMany({
      orderBy: {
        priority: "asc",
      },
    });
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Shipping Rules" subtitle="Manage shipping rules" />
        <p className="text-red-400">Failed to load shipping rules. Please try again later.</p>
      </PageContainer>
    );
  }

  const rows = rules.map((r) => ({
    ...r,
    shippingCharge: Number(r.shippingCharge),
    freeShippingAmount: Number(
      r.freeShippingAmount
    ),
  }));

  return (
    <PageContainer>
      <PageHeader
        title="Shipping Rules"
        subtitle={`${rows.length} Shipping Rules`}
      />

      <div className="mb-6 flex justify-end">
        <Link
          href="/admin/shipping/new"
          className="rounded-xl bg-amber-500 px-5 py-3 font-semibold text-black hover:bg-amber-400"
        >
          Add Shipping Rule
        </Link>
      </div>

      <ShippingTable rules={rows} />
    </PageContainer>
  );
}