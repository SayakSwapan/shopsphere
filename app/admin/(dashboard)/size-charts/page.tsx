import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";
import SizeChartsTable from "@/components/admin/size-charts/size-charts-table";

export default async function SizeChartsPage() {
  let charts;
  try {
    charts = await prisma.sizechart.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { product: true } } },
    });
  } catch {
    return (
      <PageContainer>
        <PageHeader
          title="Size Charts"
          subtitle="Manage size charts for products"
          description="Size charts let customers find their perfect fit. Create charts for clothing (S/M/L/XL) or shoes (EU/UK/US) and assign them to products."
        />
        <p className="text-red-400">Failed to load size charts.</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Size Charts"
        subtitle={`${charts.length} size charts`}
        description="Size charts let customers find their perfect fit. Create charts for clothing (S/M/L/XL) or shoes (EU/UK/US) and assign them to products."
        action={
          <Link href="/admin/size-charts/new" className="rounded-xl bg-amber-500 px-5 py-3 font-semibold text-black transition hover:bg-amber-400">
            Add Size Chart
          </Link>
        }
      />
      <SizeChartsTable charts={charts} />
    </PageContainer>
  );
}
