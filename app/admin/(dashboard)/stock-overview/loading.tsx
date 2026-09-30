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
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4 2xl:grid-cols-5">
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="min-w-0 overflow-hidden rounded-md border border-slate-800 bg-slate-950/60"
          >
            <div className="aspect-video animate-pulse bg-slate-800/50" />
            <div className="space-y-2 p-2 sm:p-3">
              <div className="h-8 animate-pulse bg-slate-800/50 sm:h-10" />
              <div className="h-3 w-2/3 animate-pulse bg-slate-800/40" />
              <div className="h-3 w-full animate-pulse bg-slate-800/30" />
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
