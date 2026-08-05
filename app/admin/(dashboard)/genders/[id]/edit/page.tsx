import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";
import GenderForm from "@/components/admin/genders/genders-form";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditGenderPage({
  params,
}: Props) {
  const { id } = await params;

  const gender = await prisma.gender.findUnique({
    where: {
      id,
    },
  });

  if (!gender) {
    return notFound();
  }

  return (
    <PageContainer>
      <PageHeader
        title="Edit Gender"
        subtitle="Update gender information"
      />

      <GenderForm
        mode="edit"
        gender={gender}
      />
    </PageContainer>
  );
}
