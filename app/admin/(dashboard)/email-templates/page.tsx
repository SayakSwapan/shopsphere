"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Mail } from "lucide-react";

interface Template {
  id: string;
  templateKey: string;
  templateName: string;
  subject: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function EmailTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      const res = await fetch("/api/admin/email-templates");
      const data = await res.json();
      setTemplates(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(id: string, current: boolean) {
    await fetch(`/api/admin/email-templates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    fetchTemplates();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete template "${name}"?`)) return;
    const res = await fetch(`/api/admin/email-templates/${id}`, { method: "DELETE" });
    if (res.ok) fetchTemplates();
  }

  const filtered = templates.filter(
    (t) =>
      t.templateName.toLowerCase().includes(search.toLowerCase()) ||
      t.templateKey.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Email Templates</h1>
          <span className="text-slate-500 mt-1">{templates.length} templates total</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-[#0F172A] text-white text-sm outline-none focus:border-amber-500 w-64"
            />
          </div>
          <Link
            href="/admin/email-templates/new"
            className="rounded-xl bg-amber-500 px-5 py-3 font-semibold text-black hover:bg-amber-400 whitespace-nowrap"
          >
            + New Template
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border" style={{ background: "#111827", borderColor: "rgba(255,255,255,.06)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ background: "#0F172A" }}>
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Template</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Subject</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <Mail size={32} className="mx-auto mb-3 opacity-30" />
                    {search ? "No templates match your search" : "No templates yet. Create your first one."}
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="border-t border-slate-700 hover:bg-slate-800/40 transition">
                    <td className="px-6 py-5">
                      <p className="font-semibold text-white text-sm">{t.templateName}</p>
                      <p className="text-xs text-amber-400 font-mono mt-1">{t.templateKey}</p>
                      {t.description && <p className="text-xs text-slate-500 mt-1">{t.description}</p>}
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-300 max-w-[200px] truncate">{t.subject}</td>
                    <td className="px-6 py-5">
                      <button
                        onClick={() => handleToggle(t.id, t.isActive)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                          t.isActive
                            ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                            : "bg-slate-600/20 text-slate-400 hover:bg-slate-600/30"
                        }`}
                      >
                        {t.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/admin/email-templates/${t.id}`)}
                          className="rounded-lg bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(t.id, t.templateName)}
                          className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-400 hover:bg-red-500/30"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
