import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";
import PrintTypeForm from "@/components/admin/print-types/print-type-form";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPrintTypePage({
  params,
}: Props) {
  const { id } = await params;

  const printType = await prisma.printtype.findUnique({
    where: { id },
  });

  if (!printType) {
    return notFound();
  }

  return (
    <PageContainer>
      <PageHeader
        title="Edit Print Type"
        subtitle="Update print style information"
      />

      <PrintTypeForm
        mode="edit"
        printType={{
          id: printType.id,
          name: printType.name,
          description: printType.description ?? "",
          pricePerLetter: Number(printType.pricePerLetter),
          minLetters: printType.minLetters,
          maxLetters: printType.maxLetters,
          designFee: Number(printType.designFee),
          allowName: printType.allowName,
          allowNumber: printType.allowNumber,
          allowImage: printType.allowImage,
          isActive: printType.isActive,
          sortOrder: printType.sortOrder,
        }}
      />
    </PageContainer>
  );
}
