"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ShippingRule {
  id?: string;
  name: string;
  minWeight: number;
  maxWeight: number;
  shippingCharge: number;
  freeShippingEnabled: boolean;
  freeShippingAmount: number;
  priority: number;
  isActive: boolean;
}

interface Props {
  shipping?: ShippingRule;
}

export default function ShippingForm({
  shipping,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<ShippingRule>({
    name: shipping?.name ?? "",
    minWeight: shipping?.minWeight ?? 0,
    maxWeight: shipping?.maxWeight ?? 500,
    shippingCharge: shipping?.shippingCharge ?? 50,
    freeShippingEnabled: shipping?.freeShippingEnabled ?? true,
    freeShippingAmount:
      shipping?.freeShippingAmount ?? 999,
    priority: shipping?.priority ?? 1,
    isActive: shipping?.isActive ?? true,
  });

  function updateField<K extends keyof ShippingRule>(
    key: K,
    value: ShippingRule[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }
  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Rule name is required");
      return;
    }

    if (form.minWeight > form.maxWeight) {
      toast.error(
        "Minimum weight cannot exceed maximum weight."
      );
      return;
    }

    setLoading(true);

    try {
      const url = shipping
        ? `/api/shipping/${shipping.id}`
        : "/api/shipping";

      const method = shipping ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message ?? "Failed to save");
        return;
      }

      toast.success(
        shipping
          ? "Shipping Rule Updated"
          : "Shipping Rule Created"
      );

      router.push("/admin/shipping");
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="space-y-8">

      <div className="rounded-2xl border border-slate-800 bg-[#111827]">

        <div className="border-b border-slate-800 px-8 py-6">

          <h2 className="text-2xl font-bold text-white">
            Shipping Rule Information
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Configure shipping charges based on package
            weight and order value.
          </p>

        </div>

        <div className="grid gap-6 p-8 md:grid-cols-2">

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Rule Name
            </label>

            <input
              value={form.name}
              onChange={(e) =>
                updateField("name", e.target.value)
              }
              placeholder="Example: 0 - 500 Gram"
              className="h-12 w-full rounded-xl border border-slate-700 bg-[#0B1624] px-4 text-white outline-none transition focus:border-amber-500"
            />

          </div>

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Priority
            </label>

            <input
              type="number"
              value={form.priority}
              onChange={(e) =>
                updateField(
                  "priority",
                  Number(e.target.value)
                )
              }
              className="h-12 w-full rounded-xl border border-slate-700 bg-[#0B1624] px-4 text-white outline-none transition focus:border-amber-500"
            />

          </div>

        </div>

      </div>

      <div className="rounded-2xl border border-slate-800 bg-[#111827]">

        <div className="border-b border-slate-800 px-8 py-6">

          <h2 className="text-xl font-bold text-white">
            Weight Configuration
          </h2>

        </div>

        <div className="grid gap-6 p-8 md:grid-cols-2">

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Minimum Weight
            </label>

            <div className="relative">

              <input
                type="number"
                value={form.minWeight}
                onChange={(e) =>
                  updateField(
                    "minWeight",
                    Number(e.target.value)
                  )
                }
                className="h-12 w-full rounded-xl border border-slate-700 bg-[#0B1624] px-4 pr-12 text-white outline-none transition focus:border-amber-500"
              />

              <span className="absolute right-4 top-3 text-slate-400">
                g
              </span>

            </div>

          </div>

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Maximum Weight
            </label>

            <div className="relative">

              <input
                type="number"
                value={form.maxWeight}
                onChange={(e) =>
                  updateField(
                    "maxWeight",
                    Number(e.target.value)
                  )
                }
                className="h-12 w-full rounded-xl border border-slate-700 bg-[#0B1624] px-4 pr-12 text-white outline-none transition focus:border-amber-500"
              />

              <span className="absolute right-4 top-3 text-slate-400">
                g
              </span>

            </div>

          </div>

        </div>
        <div className="rounded-2xl border border-slate-800 bg-[#111827]">

          <div className="border-b border-slate-800 px-8 py-6">
            <h2 className="text-xl font-bold text-white">
              Shipping Charges
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Configure shipping cost and free shipping threshold.
            </p>
          </div>

          <div className="grid gap-6 p-8 md:grid-cols-2">

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Shipping Charge
              </label>

              <div className="relative">

                <span className="absolute left-4 top-3 text-slate-400">
                  ₹
                </span>

                <input
                  type="number"
                  value={form.shippingCharge}
                  onChange={(e) =>
                    updateField(
                      "shippingCharge",
                      Number(e.target.value)
                    )
                  }
                  className="h-12 w-full rounded-xl border border-slate-700 bg-[#0B1624] pl-8 pr-4 text-white outline-none transition focus:border-amber-500"
                />

              </div>

            </div>

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Free Shipping Above
              </label>

              <div className="relative">

                <span className="absolute left-4 top-3 text-slate-400">
                  ₹
                </span>

                <input
                  type="number"
                  value={form.freeShippingAmount}
                  onChange={(e) =>
                    updateField(
                      "freeShippingAmount",
                      Number(e.target.value)
                    )
                  }
                  disabled={!form.freeShippingEnabled}
                  className="h-12 w-full rounded-xl border border-slate-700 bg-[#0B1624] pl-8 pr-4 text-white outline-none transition focus:border-amber-500 disabled:opacity-40 disabled:cursor-not-allowed"
                />

              </div>

            </div>

          </div>

          <div className="flex items-center justify-between px-8 pb-8">

            <div>

              <p className="font-semibold text-white">
                Enable Free Shipping Threshold
              </p>

              <p className="text-sm text-slate-400">
                When enabled, orders above this amount get free shipping.
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                updateField(
                  "freeShippingEnabled",
                  !form.freeShippingEnabled
                )
              }
              className={`relative h-8 w-16 rounded-full transition ${form.freeShippingEnabled
                ? "bg-green-500"
                : "bg-slate-700"
                }`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${form.freeShippingEnabled
                  ? "left-9"
                  : "left-1"
                  }`}
              />
            </button>

          </div>

        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#111827]">

          <div className="border-b border-slate-800 px-8 py-6">

            <h2 className="text-xl font-bold text-white">
              Status
            </h2>

          </div>

          <div className="flex items-center justify-between p-8">

            <div>

              <p className="font-semibold text-white">
                Enable Shipping Rule
              </p>

              <p className="text-sm text-slate-400">
                Disable this rule without deleting it.
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                updateField(
                  "isActive",
                  !form.isActive
                )
              }
              className={`relative h-8 w-16 rounded-full transition ${form.isActive
                ? "bg-amber-500"
                : "bg-slate-700"
                }`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${form.isActive
                  ? "left-9"
                  : "left-1"
                  }`}
              />
            </button>

          </div>

        </div>
        <div className="flex justify-end gap-4">

          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-slate-700 px-6 py-3 font-semibold text-slate-300 transition hover:bg-slate-800"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="rounded-xl bg-amber-500 px-8 py-3 font-bold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Saving..."
              : shipping
                ? "Update Shipping Rule"
                : "Create Shipping Rule"}
          </button>
        </div>

      </div>
    </div>

  );
}
