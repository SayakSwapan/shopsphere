import { prisma } from "@/lib/prisma";

import SizeForm from "@/components/admin/sizes/size-form";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditSizePage({
  params,
}: Props) {
  const { id } =
    await params;

  const size =
    await prisma.size.findUnique({
      where: {
        id,
      },
    });

  if (!size) {
    return (
      <div>
        Size not found
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">
        Edit Size
      </h1>

      <SizeForm
        initialData={size}
      />
    </div>
  );
}