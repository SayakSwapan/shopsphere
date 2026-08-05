import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";

import CategoryForm from "@/components/admin/categories/categories-form";

export default function NewCategoryPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Add Category"
        subtitle="Create a new product category"
      />

      <CategoryForm />
    </PageContainer>
  );
}