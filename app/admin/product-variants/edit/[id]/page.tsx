import VariantForm from "@/components/admin/product-variants/variant-form";

import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditVariantPage({
  params,
}: Props) {
  const { id } =
    await params;

  const variant =
    await prisma.productvariant.findUnique({
      where: {
        id,
      },
    });

  if (!variant) {
    return (
      <div>
        Variant not found
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">
        Edit Variant
      </h1>

      <VariantForm
        initialData={{
          id: variant.id,

          productId:
            variant.productId,

          genderId:
            variant.genderId,

          sizeId:
            variant.sizeId,

          stock:
            String(
              variant.stock
            ),

          sku: variant.sku,
        }}
      />
    </div>
  );
}