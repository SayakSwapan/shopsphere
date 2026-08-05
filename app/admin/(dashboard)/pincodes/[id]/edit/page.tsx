import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";
import PincodeForm from "@/components/admin/pincodes/pincode-form";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPincodePage({ params }: Props) {
  const { id } = await params;

  const pincode = await prisma.pincode.findUnique({
    where: { id },
  });

  if (!pincode) {
    return notFound();
  }

  return (
    <PageContainer>
      <PageHeader
        title="Edit Pincode"
        subtitle="Update pincode information"
      />

      <PincodeForm mode="edit" pincode={pincode} />
    </PageContainer>
  );
}
