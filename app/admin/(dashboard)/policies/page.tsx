import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";
import PolicyManager, {
  Policy,
} from "@/components/admin/settings/policy-manager";
import { prisma } from "@/lib/prisma";

export default async function PoliciesPage() {
  const policies = await prisma.policy.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  const initialPolicies: Policy[] = policies.map((policy) => ({
    id: policy.id,
    title: policy.title,
    slug: policy.slug,
    type: policy.type,
    content: policy.content,
    isActive: policy.isActive,
    createdAt: policy.createdAt.toISOString(),
  }));

  return (
    <PageContainer>
      <PageHeader
        title="Policies"
        subtitle="Manage returns, shipping, warranty & terms"
      />

      <PolicyManager initialPolicies={initialPolicies} />
    </PageContainer>
  );
}
