"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Item {
  id: string;
  categoryId: string;
  sortOrder: number;
  isActive: boolean;
}

interface Props {
  categories: Category[];
  mode?: "create" | "edit";
  item?: Item;
}

export default function SportsCategoryItemForm({ categories, mode = "create", item }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    categoryId: item?.categoryId ?? "",
    sortOrder: item?.sortOrder ?? 0,
    isActive: item?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId) {
      toast.error("Please select a category");
      return;
    }
    setSaving(true);
    try {
      const url =
        mode === "edit"
          ? `/api/admin/sports-categories/${item?.id}`
          : "/api/admin/sports-categories";
      const res = await fetch(url, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      toast.success(mode === "edit" ? "Category updated" : "Category added");
      router.push("/admin/sports-home-content");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <Link
        href="/admin/sports-home-content"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Sports Homepage
      </Link>

      <h1 className="text-2xl font-bold text-white mb-6">
        {mode === "edit" ? "Edit" : "Add"} Shop by Sport Category
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-[#111827] p-6 rounded-xl border border-[#1E293B]">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Category *</label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="w-full bg-[#0A0F1E] border border-[#1E293B] text-white rounded-lg px-4 py-2.5 text-sm focus:border-amber-500/50 outline-none"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-600">
            Shown in the &quot;Shop by Sport&quot; strip on the sports homepage.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Sort Order</label>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
              className="w-full bg-[#0A0F1E] border border-[#1E293B] text-white rounded-lg px-4 py-2.5 text-sm focus:border-amber-500/50 outline-none"
            />
            <p className="mt-1 text-xs text-slate-600">Lower = shows first</p>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-3 cursor-pointer py-2.5">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-[#1E293B] bg-[#0A0F1E] text-amber-500 focus:ring-amber-500/50"
              />
              <span className="text-sm text-slate-300">Active</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Link href="/admin/sports-home-content" className="px-4 py-2 text-sm text-slate-400 hover:text-white">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="bg-amber-500 text-[#0A0F1E] px-6 py-2 rounded-lg text-sm font-semibold hover:bg-amber-400 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
