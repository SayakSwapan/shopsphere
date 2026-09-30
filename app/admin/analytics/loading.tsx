import PageContainer from "@/components/admin/common/page-container";

export default function AnalyticsLoading() {
  return (
    <PageContainer>
      <div className="space-y-3">
        <div className="h-8 w-56 animate-pulse bg-slate-800/60" />
        <div className="h-4 w-full max-w-sm animate-pulse bg-slate-800/40" />
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-28 min-w-0 animate-pulse border-l-2 border-slate-700 bg-slate-900/60 sm:h-32"
          />
        ))}
      </div>
      <section className="min-w-0 overflow-hidden border border-slate-800 bg-slate-950/40">
        <div className="flex flex-col gap-3 border-b border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="space-y-2">
            <div className="h-6 w-48 animate-pulse bg-slate-800/60" />
            <div className="h-4 w-32 animate-pulse bg-slate-800/40" />
          </div>
          <div className="h-10 w-full animate-pulse bg-slate-800/50 sm:w-72" />
        </div>
        <div className="hidden md:block">
          <div className="h-11 animate-pulse bg-slate-800/50" />
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="grid grid-cols-5 gap-4 border-t border-slate-800 p-5"
            >
              {Array.from({ length: 5 }, (_, cellIndex) => (
                <div
                  key={cellIndex}
                  className="h-5 animate-pulse bg-slate-800/40"
                />
              ))}
            </div>
          ))}
        </div>
        <div className="divide-y divide-slate-800 md:hidden">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="space-y-3 p-4">
              <div className="h-5 w-2/3 animate-pulse bg-slate-800/50" />
              <div className="h-4 w-3/4 animate-pulse bg-slate-800/40" />
              <div className="h-4 w-full animate-pulse bg-slate-800/30" />
            </div>
          ))}
        </div>
      </section>
    </PageContainer>
  );
}
