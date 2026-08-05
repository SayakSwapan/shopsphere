import { prisma } from "@/lib/prisma";
import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";
import SizeChartForm from "@/components/admin/size-charts/size-chart-form";

export default async function NewSizeChartPage() {
  const categories = await prisma.category.findMany({
    where: { sizeCategory: { notIn: ["", "NONE"] } },
    select: { name: true, sizeCategory: true },
  });

  return (
    <PageContainer>
      <PageHeader
        title="Create Size Chart"
        subtitle="Add a new size chart for products"
        description="Define a reusable size chart. Choose a category to load a template, then customise the measurements."
      />
      <SizeChartForm mode="create" categories={categories} />
    </PageContainer>
  );
}
