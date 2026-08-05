import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";
import SizeChartForm from "@/components/admin/size-charts/size-chart-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditSizeChartPage({ params }: Props) {
  const { id } = await params;

  let chart;
  try {
    chart = await prisma.sizechart.findUnique({ where: { id } });
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Edit Size Chart" subtitle="Update size chart details" />
        <p className="text-red-400">Failed to load size chart.</p>
      </PageContainer>
    );
  }

  if (!chart) return notFound();

  const categories = await prisma.category.findMany({
    where: { sizeCategory: { notIn: ["", "NONE"] } },
    select: { name: true, sizeCategory: true },
  });

  return (
    <PageContainer>
      <PageHeader
        title="Edit Size Chart"
        subtitle={`Editing: ${chart.name}`}
        description="Update the size chart details. Changes will apply to all products linked to this chart."
      />
      <SizeChartForm
        mode="edit"
        categories={categories}
        chart={{
          ...chart,
          headerRow: JSON.parse(chart.headerRow),
          rows: JSON.parse(chart.rows),
        }}
      />
    </PageContainer>
  );
}
