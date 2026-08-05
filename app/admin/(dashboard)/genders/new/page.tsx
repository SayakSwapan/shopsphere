import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";

import GenderForm from "@/components/admin/genders/genders-form";

export default function NewGenderPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Add Gender"
        subtitle="Create a new product gender"
      />

      <GenderForm />
    </PageContainer>
  );
}
