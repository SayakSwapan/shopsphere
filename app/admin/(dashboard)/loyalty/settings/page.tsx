"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Save,
  Loader2,
  Gift,
  Palette,
  Award,
  ShieldCheck,
  Info,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { LoyaltyProgressCard } from "@/components/loyalty/loyalty-badge-card";

interface Program {
  id: string;
  isActive: boolean;
  requiredPurchases: number;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  maxEligibleOrderAmount: number | null;
  maxDiscountAmount: number | null;
  minimumOrderAmount: number | null;
  rewardValidityDays: number | null;
  badgeName: string;
  badgeDescription: string | null;
  badgeIcon: string | null;
  badgeImage: string | null;
  badgeBackgroundColor: string;
  badgeTextColor: string;
  badgeBorderColor: string;
}

type Tab = "settings" | "badge";

const inputCls =
  "w-full bg-[#0A0F1E] border border-[#1E293B] text-white rounded-lg px-4 py-2.5 text-sm focus:border-amber-500/50 outline-none";
const labelCls = "block text-sm font-medium text-slate-300 mb-1.5";

export default function LoyaltySettingsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("settings");
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/loyalty/settings").then((r) => r.json()),
      fetch("/api/admin/loyalty/badge").then((r) => r.json()),
    ])
      .then(([settingsRes, badgeRes]) => {
        if (settingsRes.success) {
          setProgram({
            ...settingsRes.program,
            ...(badgeRes.success ? badgeRes.badge : {}),
          });
        }
      })
      .catch(() => toast.error("Failed to load loyalty settings"))
      .finally(() => setLoading(false));
  }, []);

  const update = (patch: Partial<Program>) => {
    setProgram((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const saveSettings = async () => {
    if (!program) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/loyalty/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: program.isActive,
          requiredPurchases: program.requiredPurchases,
          discountType: program.discountType,
          discountValue: program.discountValue,
          maxEligibleOrderAmount:
            program.maxEligibleOrderAmount ?? null,
          maxDiscountAmount: program.maxDiscountAmount ?? null,
          minimumOrderAmount: program.minimumOrderAmount ?? null,
          rewardValidityDays: program.rewardValidityDays ?? null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Loyalty settings saved");
      router.refresh();
    } catch {
      toast.error("Failed to save loyalty settings");
    } finally {
      setSaving(false);
    }
  };

  const saveBadge = async () => {
    if (!program) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/loyalty/badge", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          badgeName: program.badgeName,
          badgeDescription: program.badgeDescription,
          badgeIcon: program.badgeIcon,
          badgeImage: program.badgeImage,
          badgeBackgroundColor: program.badgeBackgroundColor,
          badgeTextColor: program.badgeTextColor,
          badgeBorderColor: program.badgeBorderColor,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Badge design saved");
      router.refresh();
    } catch {
      toast.error("Failed to save badge design");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="text-amber-400 animate-spin" />
      </div>
    );
  }

  if (!program) return null;

  const previewDiscountLabel =
    program.discountType === "PERCENTAGE"
      ? `${program.discountValue}%`
      : `₹${program.discountValue}`;

  return (
    <div className="max-w-4xl">
      <div className="px-6 py-4 border-b border-[#1E293B] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Loyalty Program</h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure reward rules and badge design
          </p>
        </div>
        <button
          onClick={tab === "settings" ? saveSettings : saveBadge}
          disabled={saving}
          className="flex items-center gap-2 bg-amber-500 text-[#0A0F1E] px-5 py-2 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-4">
        <TabButton active={tab === "settings"} onClick={() => setTab("settings")} icon={Gift} label="Program Settings" />
        <TabButton active={tab === "badge"} onClick={() => setTab("badge")} icon={Palette} label="Badge Design" />
      </div>

      <div className="p-6 pt-2 space-y-6">
        {tab === "settings" ? (
          <>
            {/* Program status */}
            <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">Loyalty Program Status</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    When inactive, no purchases are counted and no rewards can be redeemed.
                  </p>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={program.isActive}
                      onChange={(e) => update({ isActive: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 rounded-full bg-[#1E293B] peer-checked:bg-amber-500 transition-colors" />
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
                  </div>
                  <span className={`text-sm font-semibold ${program.isActive ? "text-emerald-400" : "text-slate-400"}`}>
                    {program.isActive ? "Active" : "Inactive"}
                  </span>
                </label>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Required purchases */}
              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6">
                <label className={labelCls}>Required Number of Purchases</label>
                <input
                  type="number"
                  min={1}
                  value={program.requiredPurchases}
                  onChange={(e) => update({ requiredPurchases: Number(e.target.value) || 1 })}
                  className={inputCls}
                />
                <p className="text-xs text-slate-500 mt-2">
                  How many eligible purchases a customer needs to unlock the reward.
                </p>
              </div>

              {/* Discount type */}
              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6">
                <label className={labelCls}>Reward Discount Type</label>
                <select
                  value={program.discountType}
                  onChange={(e) => update({ discountType: e.target.value as "PERCENTAGE" | "FIXED" })}
                  className={inputCls}
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (₹)</option>
                </select>
              </div>

              {/* Discount value */}
              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6">
                <label className={labelCls}>
                  Reward Discount Value {program.discountType === "PERCENTAGE" ? "(%)" : "(₹)"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={program.discountValue}
                  onChange={(e) => update({ discountValue: Number(e.target.value) || 0 })}
                  className={inputCls}
                />
                <p className="text-xs text-slate-500 mt-2">
                  {program.discountType === "PERCENTAGE"
                    ? "e.g. 30 = 30% off"
                    : "e.g. 500 = ₹500 off"}
                </p>
              </div>

              {/* Max eligible order amount */}
              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6">
                <label className={labelCls}>Maximum Eligible Order Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={program.maxEligibleOrderAmount ?? ""}
                  onChange={(e) =>
                    update({
                      maxEligibleOrderAmount: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  placeholder="Optional"
                  className={inputCls}
                />
                <p className="text-xs text-slate-500 mt-2">
                  Only this portion of a larger order is considered for the discount.
                </p>
              </div>

              {/* Max discount amount */}
              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6">
                <label className={labelCls}>Maximum Discount Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={program.maxDiscountAmount ?? ""}
                  onChange={(e) =>
                    update({ maxDiscountAmount: e.target.value === "" ? null : Number(e.target.value) })
                  }
                  placeholder="Optional"
                  className={inputCls}
                />
                <p className="text-xs text-slate-500 mt-2">
                  Cap the discount even if the percentage would exceed this value.
                </p>
              </div>

              {/* Min order amount for reward */}
              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6">
                <label className={labelCls}>Minimum Order Amount for Reward Usage (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={program.minimumOrderAmount ?? ""}
                  onChange={(e) =>
                    update({ minimumOrderAmount: e.target.value === "" ? null : Number(e.target.value) })
                  }
                  placeholder="Optional"
                  className={inputCls}
                />
                <p className="text-xs text-slate-500 mt-2">
                  Order must be at least this amount to redeem the reward.
                </p>
              </div>

              {/* Reward validity */}
              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6">
                <label className={labelCls}>Reward Validity (days)</label>
                <input
                  type="number"
                  min={0}
                  value={program.rewardValidityDays ?? ""}
                  onChange={(e) =>
                    update({ rewardValidityDays: e.target.value === "" ? null : Number(e.target.value) })
                  }
                  placeholder="Leave blank for no expiry"
                  className={inputCls}
                />
                <p className="text-xs text-slate-500 mt-2">
                  How long an unlocked reward stays valid. Blank = no expiry.
                </p>
              </div>
            </div>

            {/* Live preview */}
            <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Info size={15} className="text-amber-400" />
                <h3 className="font-semibold text-white">Reward Example</h3>
              </div>
              {(() => {
                const eligible = program.maxEligibleOrderAmount ?? 0;
                const value = program.maxEligibleOrderAmount ?? 0;
                let calc = program.discountType === "PERCENTAGE"
                  ? (value * program.discountValue) / 100
                  : program.discountValue;
                if (program.maxDiscountAmount && calc > program.maxDiscountAmount) calc = program.maxDiscountAmount;
                return (
                  <div className="space-y-2 text-sm text-slate-400">
                    <div className="flex justify-between"><span>Order total</span><span className="text-white">₹{eligible.toLocaleString("en-IN")}</span></div>
                    <div className="flex justify-between"><span>Loyalty discount ({previewDiscountLabel})</span><span className="text-emerald-400">−₹{calc.toFixed(2)}</span></div>
                    <div className="flex justify-between border-t border-[#1E293B] pt-2"><span className="font-semibold text-white">Final total</span><span className="font-semibold text-white">₹{Math.max(0, eligible - calc).toFixed(2)}</span></div>
                  </div>
                );
              })()}
            </div>
          </>
        ) : (
          <>
            {/* Badge preview */}
            <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award size={15} className="text-amber-400" />
                <h3 className="font-semibold text-white">Live Badge Preview</h3>
              </div>
              <BadgePreview program={program} />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6">
                <label className={labelCls}>Badge Name</label>
                <input
                  type="text"
                  value={program.badgeName}
                  onChange={(e) => update({ badgeName: e.target.value })}
                  placeholder="e.g. Loyal Customer"
                  className={inputCls}
                />
              </div>

              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6">
                <label className={labelCls}>Badge Icon</label>
                <select
                  value={program.badgeIcon ?? ""}
                  onChange={(e) => update({ badgeIcon: e.target.value || null })}
                  className={inputCls}
                >
                  <option value="">None (default trophy)</option>
                  <option value="crown">Crown</option>
                  <option value="star">Star</option>
                  <option value="gift">Gift</option>
                  <option value="trending">Trending Up</option>
                </select>
              </div>

              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6 md:col-span-2">
                <label className={labelCls}>Badge Description</label>
                <textarea
                  value={program.badgeDescription ?? ""}
                  onChange={(e) => update({ badgeDescription: e.target.value || null })}
                  rows={3}
                  placeholder="🎉 Congratulations! You completed your purchases and unlocked your reward."
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Colors */}
              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6">
                <label className={labelCls}>Badge Background Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={program.badgeBackgroundColor}
                    onChange={(e) => update({ badgeBackgroundColor: e.target.value })}
                    className="h-10 w-14 rounded cursor-pointer bg-transparent border border-[#1E293B]"
                  />
                  <input
                    type="text"
                    value={program.badgeBackgroundColor}
                    onChange={(e) => update({ badgeBackgroundColor: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6">
                <label className={labelCls}>Badge Text Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={program.badgeTextColor}
                    onChange={(e) => update({ badgeTextColor: e.target.value })}
                    className="h-10 w-14 rounded cursor-pointer bg-transparent border border-[#1E293B]"
                  />
                  <input
                    type="text"
                    value={program.badgeTextColor}
                    onChange={(e) => update({ badgeTextColor: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6">
                <label className={labelCls}>Badge Border Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={program.badgeBorderColor}
                    onChange={(e) => update({ badgeBorderColor: e.target.value })}
                    className="h-10 w-14 rounded cursor-pointer bg-transparent border border-[#1E293B]"
                  />
                  <input
                    type="text"
                    value={program.badgeBorderColor}
                    onChange={(e) => update({ badgeBorderColor: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6">
                <label className={labelCls}>Badge Image URL (optional)</label>
                <input
                  type="text"
                  value={program.badgeImage ?? ""}
                  onChange={(e) => update({ badgeImage: e.target.value || null })}
                  placeholder="https://… (overrides icon)"
                  className={inputCls}
                />
                <p className="text-xs text-slate-500 mt-2">
                  If provided, this image is shown instead of the icon.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 flex items-start gap-3">
              <ShieldCheck size={16} className="text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-400 leading-relaxed">
                Changes to the badge design apply to new rewards and future display. Historical orders and
                past reward records keep the badge configuration they were created with.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
        active
          ? "bg-amber-500 text-[#0A0F1E]"
          : "text-slate-400 hover:text-white hover:bg-white/5"
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function BadgePreview({ program }: { program: Program }) {
  return (
    <div className="py-4">
      <LoyaltyProgressCard
        purchaseCount={program.requiredPurchases}
        requiredPurchases={program.requiredPurchases}
        availableReward
        discountLabel={
          program.discountType === "PERCENTAGE"
            ? `${program.discountValue}% off`
            : `₹${program.discountValue} off`
        }
        design={{
          badgeName: program.badgeName || "Loyal Customer",
          badgeBackgroundColor: program.badgeBackgroundColor,
          badgeTextColor: program.badgeTextColor,
          badgeBorderColor: program.badgeBorderColor,
          badgeIcon: program.badgeIcon,
          badgeImage: program.badgeImage,
          badgeDescription: program.badgeDescription,
        }}
      />
      <p className="mt-3 text-center text-xs text-slate-500">
        This is how the badge appears to customers.
      </p>
    </div>
  );
}