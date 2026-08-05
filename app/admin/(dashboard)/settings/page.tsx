import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";
import SettingsContent from "@/components/admin/settings/settings-content";

export default function SettingsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        subtitle="Manage your business policies"
        description="Configure site settings, policies, and general store preferences."
      />

      <SettingsContent />
    </PageContainer>
  );
}
