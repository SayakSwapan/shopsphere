import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";

import ShippingForm from "@/components/admin/shipping/shipping-form";

export default function NewShippingPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Create Shipping Rule"
        subtitle="Add a new shipping rule"
      />

      <ShippingForm />
    </PageContainer>
  );
}