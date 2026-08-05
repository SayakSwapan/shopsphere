"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import FieldHint from "@/components/admin/common/field-hint";
import { SIZE_CATEGORY_LABELS, SIZE_CATEGORY_SUGGESTIONS } from "@/lib/constants/size-units";

interface SizeChart {
  id?: string;
  name: string;
  sizeCategory: string;
  description: string | null;
  headerRow: string[];
  rows: string[][];
  isActive: boolean;
  image?: string | null;
}

interface CategoryRef {
  name: string;
  sizeCategory: string;
}

interface Props {
  mode?: "create" | "edit";
  chart?: SizeChart;
  categories?: CategoryRef[];
}

const TEMPLATES: Record<string, { headers: string[]; rows: string[][] }> = {
  CLOTHING: {
    headers: ["Size", "Chest (in)", "Waist (in)", "Length (in)"],
    rows: [
      ["XS", "34-36", "28-30", "26"],
      ["S", "36-38", "30-32", "27"],
      ["M", "38-40", "32-34", "28"],
      ["L", "40-42", "34-36", "29"],
      ["XL", "42-44", "36-38", "30"],
      ["XXL", "44-46", "38-40", "31"],
    ],
  },
  SHOES: {
    headers: ["EU", "UK", "US", "CM"],
    rows: [
      ["38", "5", "6", "24.0"],
      ["39", "6", "7", "24.5"],
      ["40", "6.5", "7.5", "25.0"],
      ["41", "7", "8", "25.5"],
      ["42", "8", "9", "26.5"],
      ["43", "9", "10", "27.5"],
      ["44", "9.5", "10.5", "28.0"],
      ["45", "10.5", "11.5", "29.0"],
    ],
  },
  BALL: {
    headers: ["Size", "Circumference (cm)", "Weight (g)", "Age Group"],
    rows: [
      ["Size 3", "58-60", "290-310", "Under 8"],
      ["Size 4", "63-65", "330-350", "8-12 years"],
      ["Size 5", "68-70", "410-450", "12+ / Adult"],
    ],
  },
  BAT: {
    headers: ["Size", "Blade Length (in)", "Weight (g)", "Age Group"],
    rows: [
      ["Size 0", "19-20", "680-720", "Under 6"],
      ["Size 1", "20-21", "720-760", "6-7 years"],
      ["Size 2", "21-22", "760-800", "8-9 years"],
      ["Size 3", "22-23", "800-840", "10-11 years"],
      ["Size 4", "23-24", "840-880", "12-13 years"],
      ["Size 5", "24-25", "880-940", "14-15 years"],
      ["Size 6", "25-26", "940-1000", "16+ / Adult"],
    ],
  },
  FREESIZE: {
    headers: ["Size", "Description"],
    rows: [
      ["Free Size", "One size fits all"],
    ],
  },
};

const CATEGORY_LIST = [...SIZE_CATEGORY_SUGGESTIONS];

export default function SizeChartForm({ mode = "create", chart, categories = [] }: Props) {
  const router = useRouter();
  const [name, setName] = useState(chart?.name || "");
  const [sizeCategory, setSizeCategory] = useState(chart?.sizeCategory || "CLOTHING");
  const [description, setDescription] = useState(chart?.description || "");
  const [headerRow, setHeaderRow] = useState<string[]>(
    chart?.headerRow || TEMPLATES.CLOTHING.headers
  );
  const [rows, setRows] = useState<string[][]>(
    chart?.rows || TEMPLATES.CLOTHING.rows
  );
  const [image, setImage] = useState(chart?.image || "");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const matchedCategories = categories.filter((c) => c.sizeCategory === sizeCategory);

  function applyTemplate(cat: string) {
    const tpl = TEMPLATES[cat];
    if (tpl) {
      setHeaderRow([...tpl.headers]);
      setRows(tpl.rows.map((r) => [...r]));
    }
  }

  function selectCategory(cat: string) {
    setSizeCategory(cat);
    setShowSuggestions(false);
    if (!chart) applyTemplate(cat);
  }

  function addRow() {
    setRows([...rows, headerRow.map(() => "")]);
  }

  function removeRow(idx: number) {
    setRows(rows.filter((_, i) => i !== idx));
  }

  function updateCell(rowIdx: number, colIdx: number, value: string) {
    const updated = rows.map((row, ri) =>
      ri === rowIdx ? row.map((cell, ci) => (ci === colIdx ? value : cell)) : row
    );
    setRows(updated);
  }

  function updateHeader(colIdx: number, value: string) {
    const updated = headerRow.map((h, i) => (i === colIdx ? value : h));
    setHeaderRow(updated);
  }

  function addColumn() {
    setHeaderRow([...headerRow, ""]);
    setRows(rows.map((r) => [...r, ""]));
  }

  function removeColumn(idx: number) {
    if (headerRow.length <= 2) return;
    setHeaderRow(headerRow.filter((_, i) => i !== idx));
    setRows(rows.map((r) => r.filter((_, i) => i !== idx)));
  }

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error("Chart name is required.");
      return;
    }
    if (rows.length === 0) {
      toast.error("Add at least one row.");
      return;
    }

    setLoading(true);
    try {
      const url = mode === "edit" && chart?.id ? `/api/admin/size-charts/${chart.id}` : "/api/admin/size-charts";
      const res = await fetch(url, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          sizeCategory,
          description,
          headerRow,
          rows,
          image: image || null,
          isActive: chart?.isActive ?? true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to save size chart.");
        setLoading(false);
        return;
      }
      toast.success(mode === "edit" ? "Size chart updated." : "Size chart created.");
      router.push("/admin/size-charts");
      router.refresh();
    } catch {
      toast.error("Failed to save size chart.");
      setLoading(false);
    }
  }

  const fieldClass =
    "w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white outline-none transition focus:border-amber-500";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-700 bg-[#111827] p-6">
        <h2 className="mb-6 text-xl font-bold text-white">Size Chart Details</h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Chart Name <FieldHint text="A descriptive name, e.g. 'Men T-Shirts' or 'Cricket Bats'." />
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Men T-Shirts"
              className={fieldClass}
            />
          </div>

          <div className="relative">
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Size Category <FieldHint text="Choose a category to load a template, or type your own for custom sizing." />
            </label>

            <input
              value={sizeCategory}
              onChange={(e) => setSizeCategory(e.target.value.toUpperCase())}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="e.g. CLOTHING, SHOES, BALL, BAT..."
              className={fieldClass}
            />

            {showSuggestions && (
              <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-600 bg-[#1E293B] shadow-2xl">
                {CATEGORY_LIST.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onMouseDown={() => selectCategory(cat)}
                    className={`w-full px-4 py-2.5 text-left text-sm transition hover:bg-slate-700 ${
                      sizeCategory === cat ? "text-amber-400" : "text-slate-200"
                    }`}
                  >
                    <span className="font-semibold">{cat}</span>
                    <span className="ml-2 text-xs text-slate-500">
                      {SIZE_CATEGORY_LABELS[cat] || ""}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-2 flex flex-wrap gap-2">
              {["CLOTHING", "SHOES", "BALL", "BAT", "FREESIZE"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => selectCategory(cat)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    sizeCategory === cat
                      ? "bg-amber-500 text-black"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {matchedCategories.length > 0 && (
              <div className="mt-2 rounded-lg border border-slate-700 bg-slate-800/50 p-2.5">
                <p className="text-[11px] font-semibold text-amber-400">Used by {matchedCategories.length} categor{matchedCategories.length === 1 ? "y" : "ies"}:</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {matchedCategories.map((c) => (
                    <span key={c.name} className="rounded bg-slate-700/60 px-2 py-0.5 text-[10px] text-slate-300">
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Description <FieldHint text="Optional note shown to customers above the size chart." />
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional description..."
              className={fieldClass}
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Measurement Diagram Image URL <FieldHint text="Upload a measurement guide image (e.g. body diagram with arrows). Customers see this in the size chart popup on the product page." />
            </label>
            <input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://res.cloudinary.com/..."
              className={fieldClass}
            />
            {image && (
              <img
                src={image}
                alt="Preview"
                className="mt-2 max-h-40 rounded-lg object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-[#111827] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Size Chart Data</h2>
          <div className="flex gap-2">
            <button
              onClick={addColumn}
              className="flex items-center gap-1 rounded-lg border border-slate-600 bg-[#0F172A] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:text-white"
            >
              <Plus size={14} /> Column
            </button>
            <button
              onClick={addRow}
              className="flex items-center gap-1 rounded-lg border border-slate-600 bg-[#0F172A] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:text-white"
            >
              <Plus size={14} /> Row
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {headerRow.map((h, ci) => (
                  <th key={ci} className="px-2 pb-2">
                    <div className="flex items-center gap-1">
                      <input
                        value={h}
                        onChange={(e) => updateHeader(ci, e.target.value)}
                        className="w-full rounded-lg border border-slate-600 bg-[#0F172A] px-3 py-2 text-xs font-bold text-amber-400 outline-none"
                      />
                      {headerRow.length > 2 && (
                        <button onClick={() => removeColumn(ci)} className="text-red-400 hover:text-red-300">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className="border-t border-slate-800">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-2 py-1.5">
                      <input
                        value={cell}
                        onChange={(e) => updateCell(ri, ci, e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-[#0F172A] px-3 py-2 text-xs text-white outline-none transition focus:border-amber-500"
                      />
                    </td>
                  ))}
                  <td className="px-2">
                    <button onClick={() => removeRow(ri)} className="text-red-400 hover:text-red-300">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="rounded-xl bg-amber-500 px-8 py-3 font-bold text-black transition hover:bg-amber-400 disabled:opacity-50"
        >
          {loading ? "Saving..." : mode === "edit" ? "Update Size Chart" : "Create Size Chart"}
        </button>
      </div>
    </div>
  );
}
