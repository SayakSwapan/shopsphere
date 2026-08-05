export default function Header() {
  return (
    <div className="h-24 px-8 flex items-center justify-between">
      {/* LEFT */}

      <div>
        <h1 className="text-3xl font-black text-slate-800">
          Dashboard
        </h1>

        <p className="text-slate-500">
          Welcome back 👋
        </p>
      </div>

      {/* RIGHT */}

      <div className="flex items-center gap-5">
        <div className="glass-card px-5 py-3 rounded-2xl">
          <p className="text-sm text-slate-500">
            Admin
          </p>

          <h2 className="font-bold">
            Ecommerce Store
          </h2>
        </div>

        <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white flex items-center justify-center text-xl font-bold shadow-xl">
          A
        </div>
      </div>
    </div>
  );
}