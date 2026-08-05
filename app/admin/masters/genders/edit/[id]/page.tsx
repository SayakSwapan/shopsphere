import { prisma } from "@/lib/prisma";

import GenderForm from "@/components/admin/genders/gender-form";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditGenderPage({
  params,
}: Props) {
  const { id } =
    await params;

  const gender =
    await prisma.gender.findUnique({
      where: {
        id,
      },
    });

  if (!gender) {
    return (
      <div>
        Gender not found
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">
        Edit Gender
      </h1>

      <GenderForm
        initialData={gender}
      />
    </div>
  );
}