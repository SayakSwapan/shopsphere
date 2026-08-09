"use client";

export default function LoadingOverlay({ isLoading }: { isLoading: boolean }) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/90 px-8 py-6 shadow-2xl">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-600 border-t-blue-500" />
        <span className="text-sm font-medium text-slate-300">Loading...</span>
      </div>
    </div>
  );
}
