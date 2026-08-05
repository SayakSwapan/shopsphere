"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Permission {
  id: string;
  name: string;
  displayName: string;
  module: string;
  category: string;
  assigned: boolean;
}

interface Props {
  partnerId: string;
  permissions: Permission[];
}

export default function PartnerPermissionForm({ partnerId, permissions }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [local, setLocal] = useState<Record<string, boolean>>(
    Object.fromEntries(permissions.map((p) => [p.id, p.assigned]))
  );

  const grouped = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.module] ??= []).push(p);
    return acc;
  }, {});

  const toggle = (id: string) => setLocal((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleModule = (module: string) => {
    const modulePerms = permissions.filter((p) => p.module === module);
    const allOn = modulePerms.every((p) => local[p.id]);
    setLocal((prev) => {
      const next = { ...prev };
      modulePerms.forEach((p) => (next[p.id] = !allOn));
      return next;
    });
  };

  const save = async () => {
    const assignedIds = Object.entries(local)
      .filter(([, v]) => v)
      .map(([k]) => k);

    const res = await fetch(`/api/admin/partners/${partnerId}/permissions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissionIds: assignedIds }),
    });

    if (res.ok) {
      startTransition(() => router.refresh());
    }
  };

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([module, perms]) => {
        const allOn = perms.every((p) => local[p.id]);

        return (
          <div key={module} className="rounded-xl border border-slate-700 bg-[#111827] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{module}</h3>
              <button
                onClick={() => toggleModule(module)}
                className="text-sm text-amber-400 hover:text-amber-300 font-medium"
              >
                {allOn ? "Deselect All" : "Select All"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {perms.map((p) => (
                <label
                  key={p.id}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition ${
                    local[p.id]
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!local[p.id]}
                    onChange={() => toggle(p.id)}
                    className="sr-only"
                  />
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded border-2 transition ${
                      local[p.id]
                        ? "border-amber-500 bg-amber-500"
                        : "border-slate-500"
                    }`}
                  >
                    {local[p.id] && (
                      <svg className="h-3 w-3 text-black" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{p.displayName}</p>
                    <p className="text-xs text-slate-400">{p.name}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        );
      })}

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={isPending}
          className="rounded-xl bg-amber-500 px-8 py-3 font-semibold text-black hover:bg-amber-400 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save Permissions"}
        </button>
      </div>
    </div>
  );
}
