"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { UseFormSetValue, UseFormWatch } from "react-hook-form";
import { ProductFormValues } from "@/types/product-form";
import FieldHint from "@/components/admin/common/field-hint";

interface Props {
  watch: UseFormWatch<ProductFormValues>;
  setValue: UseFormSetValue<ProductFormValues>;
}

interface PincodeOption {
  id: string;
  pincode: string;
}

export default function DeliverySection({ watch, setValue }: Props) {
  const [pincodes, setPincodes] = useState<PincodeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const selected = watch("restrictedPincodes") ?? [];

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/pincodes")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success) {
          setPincodes(data.pincodes);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = query
    ? pincodes.filter((p) => p.pincode.includes(query))
    : pincodes;

  function toggle(pincode: string) {
    const next = selected.includes(pincode)
      ? selected.filter((p) => p !== pincode)
      : [...selected, pincode];

    setValue("restrictedPincodes", next, { shouldDirty: true });
  }

  function toggleFiltered() {
    const allChecked = filtered.length > 0 && filtered.every((p) => selected.includes(p.pincode));

    const visibleCodes = new Set(filtered.map((p) => p.pincode));

    const next = allChecked
      ? selected.filter((p) => !visibleCodes.has(p))
      : [...new Set([...selected, ...filtered.map((p) => p.pincode)])];

    setValue("restrictedPincodes", next, { shouldDirty: true });
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-[#111827] p-6">
      <h2 className="mb-2 text-xl font-bold text-white">Delivery Restrictions</h2>
      <p className="mb-6 text-xs text-slate-500">
        Pick the pincodes where this product is <span className="text-slate-300">not deliverable</span>.
        Leave everything unchecked to deliver everywhere we ship.
      </p>

      <div className="space-y-4">
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Search pincode…"
            className="w-full rounded-lg border border-slate-700 bg-[#0F172A] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-500/60"
          />
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-700 bg-[#0F172A] px-3 py-2.5">
          <div>
            <p className="text-sm font-medium text-white">
              Select all
              <FieldHint text="Restrict this product from every listed pincode." />
            </p>
            <p className="text-xs text-slate-500">
              {filtered.length === pincodes.length
                ? `${pincodes.length} deliverable pincodes`
                : `${filtered.length} of ${pincodes.length} shown`}
            </p>
          </div>
          <input
            type="checkbox"
            checked={filtered.length > 0 && filtered.every((p) => selected.includes(p.pincode))}
            onChange={toggleFiltered}
            disabled={filtered.length === 0}
            className="h-5 w-5 accent-amber-500"
          />
        </div>

        <p className="text-sm font-semibold text-slate-300">
          Restricted Pincodes
          <FieldHint text="Customers ordering to these pincodes will be shown that this product is not deliverable, and checkout will be blocked for these items." />
        </p>

        {loading ? (
          <p className="text-xs text-slate-500">Loading pincodes…</p>
        ) : pincodes.length === 0 ? (
          <p className="text-xs text-slate-500">
            No deliverable pincodes yet —{" "}
            <a href="/admin/pincodes" className="text-amber-400 underline">
              add some first
            </a>
            .
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-slate-500">No pincodes match “{query}”.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {filtered.map((p) => {
              const checked = selected.includes(p.pincode);

              return (
                <label
                  key={p.id}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 transition ${
                    checked
                      ? "border-amber-500/60 bg-amber-500/10"
                      : "border-slate-700 bg-[#0F172A]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(p.pincode)}
                    className="h-4 w-4 accent-amber-500"
                  />
                  <span className="font-mono text-sm text-white">{p.pincode}</span>
                </label>
              );
            })}
          </div>
        )}

        {selected.length > 0 && (
          <p className="text-xs text-slate-400">
            <strong className="text-amber-400">{selected.length}</strong> pincode
            {selected.length === 1 ? "" : "s"} restricted.
          </p>
        )}
      </div>
    </div>
  );
}
