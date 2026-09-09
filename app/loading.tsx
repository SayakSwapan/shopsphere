export default function RootLoading() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4" aria-busy="true" aria-label="Loading store">
      <div className="flex flex-col items-center gap-5">
        <div className="flex items-center gap-3">
          <span
            className="h-6 w-1 rounded-full"
            style={{
              background: "var(--t-primary)",
              animation: "root-loading-bounce 1s ease-in-out infinite",
            }}
          />
          <span
            className="h-10 w-1 rounded-full"
            style={{
              background: "var(--t-primary)",
              animation: "root-loading-bounce 1s ease-in-out 0.15s infinite",
            }}
          />
          <span
            className="h-6 w-1 rounded-full"
            style={{
              background: "var(--t-primary)",
              animation: "root-loading-bounce 1s ease-in-out 0.3s infinite",
            }}
          />
        </div>

        <p
          className="text-xs font-black uppercase tracking-[0.35em] animate-pulse"
          style={{
            color: "var(--t-text-muted-2)",
            fontFamily: "var(--t-font-heading)",
          }}
        >
          Loading&hellip;
        </p>

        <style>{`@keyframes root-loading-bounce { 0%,100% { transform: scaleY(0.4); opacity: 0.4; } 50% { transform: scaleY(1); opacity: 1; } }`}</style>
      </div>
    </div>
  );
}