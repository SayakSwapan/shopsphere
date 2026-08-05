import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";

import PrintTypeForm from "@/components/admin/print-types/print-type-form";

export default function NewPrintTypePage() {
  return (
    <PageContainer>
      <PageHeader
        title="Add Print Type"
        subtitle="Create a new custom print style"
      />

      <PrintTypeForm />
    </PageContainer>
  );
}
