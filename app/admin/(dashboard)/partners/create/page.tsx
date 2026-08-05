import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";

import PartnerForm from "@/components/admin/partners/PartnerForm";

export default function CreatePartnerPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Create Partner"
        subtitle="Add a new partner account"
        description="The partner will receive login credentials and must complete their profile before they can access the dashboard."
      />

      <PartnerForm />
    </PageContainer>
  );
}
