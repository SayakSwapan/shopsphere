"use client";

import { useState, useEffect } from "react";
import { Ruler, X } from "lucide-react";

interface SizeChart {
  name: string;
  sizeCategory: string;
  description: string | null;
  headerRow: string[];
  rows: string[][];
}

interface Props {
  productId: string;
}

export default function SizeChartButton({ productId }: Props) {
  const [chart, setChart] = useState<SizeChart | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function fetchChart() {
      try {
        const res = await fetch(`/api/size-chart?productId=${productId}`);
        const data = await res.json();
        if (data.success && data.chart) {
          setChart(data.chart);
        }
      } catch {}
      setLoaded(true);
    }
    fetchChart();
  }, [productId]);

  if (!loaded || !chart) return null;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium transition"
        style={{ color: "var(--t-primary)" }}
      >
        <Ruler size={14} />
        Size Chart
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div
            className="relative w-full max-w-lg overflow-hidden border border-border-card bg-bg-card"
            style={{ borderRadius: "var(--t-radius-card)", maxHeight: "85vh" }}
          >
            <div className="flex items-center justify-between border-b border-border-card px-6 py-4">
              <div>
                <h3 className="text-lg font-bold" style={{ color: "var(--t-text-heading)" }}>
                  {chart.name}
                </h3>
                <span
                  className="inline-flex mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                  style={{
                    background: chart.sizeCategory === "SHOES" ? "color-mix(in srgb, #3b82f6 15%, transparent)" : "color-mix(in srgb, #10b981 15%, transparent)",
                    color: chart.sizeCategory === "SHOES" ? "#3b82f6" : "#10b981",
                  }}
                >
                  {chart.sizeCategory === "SHOES" ? "Shoe Sizes" : "Clothing Sizes"}
                </span>
              </div>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-2 transition hover:bg-white/10" style={{ color: "var(--t-text-muted-1)" }}>
                <X size={20} />
              </button>
            </div>

            {chart.description && (
              <div className="border-b border-border-card px-6 py-3">
                <p className="text-xs" style={{ color: "var(--t-text-muted-1)" }}>{chart.description}</p>
              </div>
            )}

            <div className="overflow-auto p-6" style={{ maxHeight: "calc(85vh - 120px)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    {chart.headerRow.map((h, i) => (
                      <th
                        key={i}
                        className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider"
                        style={{ color: "var(--t-primary)", background: "color-mix(in srgb, var(--t-primary) 5%, transparent)" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chart.rows.map((row, ri) => (
                    <tr key={ri} className="border-t border-border-card transition hover:bg-white/5">
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          className="px-4 py-3 text-sm font-medium"
                          style={{ color: ci === 0 ? "var(--t-text-heading)" : "var(--t-text-body)" }}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
