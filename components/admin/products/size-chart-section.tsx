"use client";

import { useState } from "react";
import { UseFormRegister, UseFormWatch } from "react-hook-form";
import { X } from "lucide-react";
import { ProductFormValues } from "@/types/product-form";

interface SizeChart {
  id: string;
  name: string;
  sizeCategory: string;
  description?: string | null;
  headerRow?: string;
  rows?: string;
  image?: string | null;
}

interface Props {
  sizeCharts: SizeChart[];
  register: UseFormRegister<ProductFormValues>;
  watch: UseFormWatch<ProductFormValues>;
  sizeCategory: string;
}

export default function SizeChartSection({
  sizeCharts,
  register,
  watch,
  sizeCategory,
}: Props) {
  const selectedId = watch("sizeChartId");
  const selectedChart = sizeCharts.find((sc) => sc.id === selectedId);
  const [showPopup, setShowPopup] = useState(false);

  let parsedHeaders: string[] = [];
  if (selectedChart?.headerRow) {
    try { parsedHeaders = JSON.parse(selectedChart.headerRow); } catch { parsedHeaders = []; }
  }
  let parsedRows: string[][] = [];
  if (selectedChart?.rows) {
    try { const r = JSON.parse(selectedChart.rows); if (Array.isArray(r)) { parsedRows = r as string[][]; } } catch {}
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-[#111827] p-6">
      <h2 className="mb-4 text-xl font-bold text-white">Size Chart</h2>
      <p className="mb-3 text-xs text-slate-500">
        {sizeCategory
          ? `Showing size charts for this category type (${sizeCategory}). Select a chart so customers can find their fit on the product page.`
          : "Select a category first to see relevant size charts."}
      </p>

      <select
        {...register("sizeChartId")}
        className="h-11 w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 text-white"
        disabled={!sizeCategory}
      >
        <option value="">No size chart</option>
        {sizeCharts.map((sc) => (
          <option key={sc.id} value={sc.id}>
            {sc.name}
          </option>
        ))}
      </select>

      {selectedChart && (
        <button
          type="button"
          onClick={() => setShowPopup(true)}
          className="mt-3 w-full rounded-xl border border-slate-600 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
        >
          View Size Chart
        </button>
      )}

      {showPopup && selectedChart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[#111827] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {selectedChart.name}
              </h3>
              <button
                type="button"
                onClick={() => setShowPopup(false)}
              >
                <X className="text-white" size={22} />
              </button>
            </div>

            {selectedChart.description && (
              <p className="mb-4 text-sm text-slate-400">
                {selectedChart.description}
              </p>
            )}

            {selectedChart.image && (
              <div className="mb-6 rounded-xl bg-[#0F172A] p-4">
                <p className="mb-2 text-xs font-medium text-slate-400 uppercase tracking-wide">
                  How to Measure
                </p>
                <img
                  src={selectedChart.image}
                  alt="Size measurement guide"
                  className="mx-auto max-h-80 w-auto rounded-lg object-contain"
                />
              </div>
            )}

            {parsedHeaders.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-slate-700">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-800">
                      {parsedHeaders.map((h, i) => (
                        <th
                          key={i}
                          className="px-4 py-3 font-semibold text-white"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row, ri) => (
                      <tr
                        key={ri}
                        className="border-t border-slate-700"
                      >
                        {row.map((cell, ci) => (
                          <td
                            key={ci}
                            className="px-4 py-3 text-slate-300"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
