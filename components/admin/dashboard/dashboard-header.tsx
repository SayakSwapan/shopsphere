export default function DashboardHeader() {
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
      <div>
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">Dashboard</h1>
        <p className="mt-2 text-slate-500 text-sm sm:text-base">{greeting}, Admin</p>
        <p className="mt-1 text-xs text-slate-600">Your business at a glance. Revenue, orders, inventory, and performance metrics.</p>
      </div>
      <p className="text-xs sm:text-sm text-slate-600">{dateStr}</p>
    </div>
  );
}
