import { prisma } from "@/lib/prisma";

import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";

import ShippingForm from "@/components/admin/shipping/shipping-form";

export default async function EditShippingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const shipping =
    await prisma.shippingRule.findUnique({
      where: {
        id,
      },
    });

  if (!shipping) {
    return (
      <PageContainer>
        Shipping Rule Not Found
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Edit Shipping Rule"
        subtitle={shipping.name}
      />

      <ShippingForm
        shipping={{
          ...shipping,
          shippingCharge: Number(
            shipping.shippingCharge
          ),
          freeShippingAmount: Number(
            shipping.freeShippingAmount
          ),
        }}
      />
    </PageContainer>
  );
}