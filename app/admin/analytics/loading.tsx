import PageContainer from "@/components/admin/common/page-container";

export default function AnalyticsLoading() {
  return (
    <PageContainer>
      <div className="h-20 animate-pulse bg-slate-800/60" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-32 animate-pulse bg-slate-800/50" />
        ))}
      </div>
      <div className="h-80 animate-pulse bg-slate-800/40" />
    </PageContainer>
  );
}
