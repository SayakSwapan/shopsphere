import PageContainer from "@/components/admin/common/page-container";

export default function StockOverviewLoading() {
  return (
    <PageContainer>
      <div className="h-20 animate-pulse bg-slate-800/60" />
      <div className="grid grid-cols-2 gap-px bg-slate-800 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-24 animate-pulse bg-slate-900" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="aspect-4/5 animate-pulse bg-slate-800/40"
          />
        ))}
      </div>
    </PageContainer>
  );
}
