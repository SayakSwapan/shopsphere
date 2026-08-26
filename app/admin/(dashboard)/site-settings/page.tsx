"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Save,
  Loader2,
  Clock,
  ChevronDown,
  FileText,
  Share2,
  LayoutPanelLeft,
  Info,
  Megaphone,
  AlignLeft,
  Phone,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Link2,
  Bell,
  MessageCircle,
} from "lucide-react";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(() => import("@/components/admin/ui/rich-text-editor"), { ssr: false });

interface Settings {
  [key: string]: string;
}

interface FieldDef {
  key: string;
  label: string;
  placeholder: string;
  hint?: string;
  type?: "text" | "textarea" | "rich" | "toggle" | "select";
  options?: string[];
}

interface DayHours {
  day: string;
  hours: string;
}

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const QUICK_HOURS = [
  "9:00 AM - 6:00 PM",
  "10:00 AM - 7:00 PM",
  "10:00 AM - 5:00 PM",
  "10:00 AM - 4:00 PM",
  "11:00 AM - 8:00 PM",
];

const DEFAULT_HOURS: Record<string, string> = {
  Monday: "9:00 AM - 6:00 PM",
  Tuesday: "9:00 AM - 6:00 PM",
  Wednesday: "9:00 AM - 6:00 PM",
  Thursday: "9:00 AM - 6:00 PM",
  Friday: "9:00 AM - 6:00 PM",
  Saturday: "10:00 AM - 4:00 PM",
  Sunday: "Closed",
};

function parseHoursToRows(raw: string): DayHours[] {
  if (!raw) return ALL_DAYS.map((d) => ({ day: d, hours: DEFAULT_HOURS[d] }));
  const parts = raw.split("\n").flatMap((line) => line.split("|"));
  const map: Record<string, string> = {};
  for (let i = 0; i < parts.length; i += 2) {
    const day = parts[i]?.trim();
    const hours = parts[i + 1]?.trim();
    if (day && hours) map[day.toLowerCase()] = hours;
  }
  return ALL_DAYS.map((d) => ({
    day: d,
    hours: map[d.toLowerCase()] || DEFAULT_HOURS[d] || "Closed",
  }));
}

function rowsToPipeString(rows: DayHours[]): string {
  return rows.map((r) => `${r.day}|${r.hours}`).join("\n");
}

/* ─── Accordion wrapper ─── */
function AccordionSection({
  icon: Icon,
  title,
  description,
  badge,
  defaultOpen,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-[#151D2E] transition-colors"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 shrink-0">
          <Icon size={18} className="text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white">{title}</h2>
            {badge && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
                {badge}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">{description}</p>
        </div>
        <ChevronDown
          size={16}
          className="text-slate-500 shrink-0 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>
      {open && (
        <div className="px-6 pb-6 pt-2 border-t border-[#1E293B]">
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── Field renderer ─── */
function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-300">{field.label}</label>
      {field.hint && <p className="text-[11px] text-slate-500">{field.hint}</p>}
      {field.type === "rich" ? (
        <RichTextEditor value={value} onChange={onChange} placeholder={field.placeholder} minHeight={120} />
      ) : field.type === "select" ? (
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-[#0A0F1E] border border-[#1E293B] text-white rounded-lg px-4 py-2.5 text-sm focus:border-amber-500/50 outline-none appearance-none cursor-pointer"
          >
            <option value="" disabled>{field.placeholder}</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>
      ) : field.type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#0A0F1E] border border-[#1E293B] text-white rounded-lg px-4 py-2.5 text-sm focus:border-amber-500/50 outline-none resize-none"
          rows={3}
          placeholder={field.placeholder}
        />
      ) : field.type === "toggle" ? (
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={value !== "false"}
              onChange={(e) => onChange(e.target.checked ? "true" : "false")}
              className="sr-only peer"
            />
            <div className="w-10 h-5 rounded-full bg-[#1E293B] peer-checked:bg-amber-500 transition-colors" />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
          </div>
          <span className="text-sm text-slate-300">{value !== "false" ? "Enabled" : "Disabled"}</span>
        </label>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#0A0F1E] border border-[#1E293B] text-white rounded-lg px-4 py-2.5 text-sm focus:border-amber-500/50 outline-none"
          placeholder={field.placeholder}
        />
      )}
    </div>
  );
}

/* ─── Business Hours Editor ─── */
function BusinessHoursEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [rows, setRows] = useState<DayHours[]>(() => parseHoursToRows(value));

  const update = (newRows: DayHours[]) => {
    setRows(newRows);
    onChange(rowsToPipeString(newRows));
  };

  const setAll = (hours: string) => {
    update(rows.map((r) => ({ ...r, hours })));
  };

  return (
    <div className="space-y-4">
      {/* Quick presets */}
      <div className="p-3 bg-[#0A0F1E] border border-[#1E293B] rounded-lg">
        <p className="text-[11px] text-slate-500 mb-2 font-medium uppercase tracking-wider">Quick set all days</p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_HOURS.map((qh) => (
            <button
              key={qh}
              type="button"
              onClick={() => setAll(qh)}
              className="px-2.5 py-1 text-[11px] font-medium rounded-md text-slate-400 bg-[#111827] border border-[#1E293B] hover:text-white hover:border-amber-500/30 transition-colors"
            >
              {qh}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAll("Closed")}
            className="px-2.5 py-1 text-[11px] font-medium rounded-md text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
          >
            All Closed
          </button>
        </div>
      </div>

      {/* Day rows */}
      <div className="space-y-1">
        {rows.map((row, idx) => {
          const today = new Date().getDay();
          const dayIndex = (idx + 1) % 7;
          const isToday = dayIndex === today;
          const isClosed = row.hours.trim().toLowerCase() === "closed";

          return (
            <div
              key={row.day}
              className="flex items-center gap-3 p-2.5 rounded-lg transition-colors"
              style={{
                background: isToday ? "rgba(245, 158, 11, 0.08)" : "transparent",
                border: isToday ? "1px solid rgba(245, 158, 11, 0.2)" : "1px solid transparent",
              }}
            >
              <div className="w-24 shrink-0">
                <div className="flex items-center gap-1.5">
                  {isToday && <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />}
                  <span className={`text-sm ${isToday ? "text-amber-400 font-semibold" : "text-slate-300 font-medium"}`}>
                    {row.day}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-1">
                {isClosed ? (
                  <div className="flex-1 flex items-center gap-2">
                    <span className="flex-1 text-sm text-red-400 font-medium px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                      Closed
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...rows];
                        next[idx] = { ...next[idx], hours: "9:00 AM - 6:00 PM" };
                        update(next);
                      }}
                      className="px-3 py-2 text-[11px] font-semibold rounded-lg text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors shrink-0"
                    >
                      Open
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={row.hours}
                      onChange={(e) => {
                        const next = [...rows];
                        next[idx] = { ...next[idx], hours: e.target.value };
                        update(next);
                      }}
                      placeholder="e.g. 9:00 AM - 6:00 PM"
                      className="flex-1 bg-[#0A0F1E] border border-[#1E293B] text-white rounded-lg px-3 py-2 text-sm focus:border-amber-500/50 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...rows];
                        next[idx] = { ...next[idx], hours: "Closed" };
                        update(next);
                      }}
                      className="px-3 py-2 text-[11px] font-semibold rounded-lg text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors shrink-0"
                    >
                      Close
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-slate-600 flex items-center gap-1.5">
        <Info size={11} />
        Today is highlighted with an amber dot. Changes are saved when you click &quot;Save All&quot;.
      </p>
    </div>
  );
}

/* ─── Footer Link types ─── */
interface FooterLinkItem {
  id: string;
  group: string;
  label: string;
  url: string;
  sortOrder: number;
  isActive: boolean;
}

const FOOTER_GROUPS = ["Shop", "Customer", "Support"];

const AVAILABLE_PATHS = [
  { value: "/products", label: "All Products" },
  { value: "/products?category=new-arrivals", label: "New Arrivals" },
  { value: "/products?category=trending", label: "Trending" },
  { value: "/products?category=featured", label: "Featured" },
  { value: "/products?category=sale", label: "Sale" },
  { value: "/products?category=running", label: "Running" },
  { value: "/products?category=training", label: "Training" },
  { value: "/products?category=footwear", label: "Footwear" },
  { value: "/about", label: "About Us" },
  { value: "/contact", label: "Contact Us" },
  { value: "/faqs", label: "FAQs" },
  { value: "/privacy", label: "Privacy Policy" },
  { value: "/terms", label: "Terms & Conditions" },
  { value: "/account", label: "My Account" },
  { value: "/account/orders", label: "Orders" },
  { value: "/wishlist", label: "Wishlist" },
  { value: "/cart", label: "Cart" },
];

/* ─── Footer Links Editor ─── */
function FooterLinksEditor() {
  const [links, setLinks] = useState<FooterLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ group: "Shop", label: "", url: "", sortOrder: 0, isActive: true });
  const [customUrl, setCustomUrl] = useState("");
  const [isCustomUrl, setIsCustomUrl] = useState(false);

  useEffect(() => {
    fetch("/api/admin/footer-links")
      .then((r) => r.json())
      .then((data) => setLinks(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Failed to load footer links"))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    const url = isCustomUrl ? customUrl : form.url;
    if (!form.label || !url) {
      toast.error("Label and URL are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/footer-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, url }),
      });
      if (!res.ok) throw new Error("Failed to create");
      const created = await res.json();
      setLinks((prev) => [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder));
      setForm({ group: "Shop", label: "", url: "", sortOrder: 0, isActive: true });
      setCustomUrl("");
      setIsCustomUrl(false);
      setShowAddForm(false);
      toast.success("Footer link added");
    } catch {
      toast.error("Failed to add footer link");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    const link = links.find((l) => l.id === id);
    if (!link) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/footer-links/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(link),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success("Footer link updated");
      setEditingId(null);
    } catch {
      toast.error("Failed to update footer link");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/footer-links/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setLinks((prev) => prev.filter((l) => l.id !== id));
      toast.success("Footer link deleted");
    } catch {
      toast.error("Failed to delete footer link");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string) => {
    const link = links.find((l) => l.id === id);
    if (!link) return;
    const updated = { ...link, isActive: !link.isActive };
    setLinks((prev) => prev.map((l) => (l.id === id ? updated : l)));
    try {
      await fetch(`/api/admin/footer-links/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch {
      setLinks((prev) => prev.map((l) => (l.id === id ? link : l)));
      toast.error("Failed to toggle link");
    }
  };

  const updateLinkField = (id: string, field: keyof FooterLinkItem, value: string | number) => {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  const grouped = links.reduce<Record<string, FooterLinkItem[]>>((acc, link) => {
    if (!acc[link.group]) acc[link.group] = [];
    acc[link.group].push(link);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={18} className="text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Existing links grouped */}
      {Object.entries(grouped).map(([group, groupLinks]) => (
        <div key={group}>
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">{group}</h4>
          <div className="space-y-1.5">
            {groupLinks.map((link) => (
              <div
                key={link.id}
                className="flex items-center gap-2 bg-[#0A0F1E] border border-[#1E293B] rounded-lg p-2.5 group"
              >
                {editingId === link.id ? (
                  <>
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <select
                        value={link.group}
                        onChange={(e) => updateLinkField(link.id, "group", e.target.value)}
                        className="bg-[#111827] border border-[#1E293B] text-white rounded px-2 py-1 text-xs focus:border-amber-500/50 outline-none"
                      >
                        {FOOTER_GROUPS.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => updateLinkField(link.id, "label", e.target.value)}
                        className="bg-[#111827] border border-[#1E293B] text-white rounded px-2 py-1 text-xs focus:border-amber-500/50 outline-none"
                        placeholder="Label"
                      />
                      <input
                        type="text"
                        value={link.url}
                        onChange={(e) => updateLinkField(link.id, "url", e.target.value)}
                        className="bg-[#111827] border border-[#1E293B] text-white rounded px-2 py-1 text-xs focus:border-amber-500/50 outline-none"
                        placeholder="URL"
                      />
                    </div>
                    <button
                      onClick={() => handleUpdate(link.id)}
                      disabled={saving}
                      className="px-2 py-1 text-[10px] font-bold rounded bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2 py-1 text-[10px] font-bold rounded text-slate-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <GripVertical size={14} className="text-slate-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-white">{link.label}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${link.isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-500/15 text-slate-500"}`}>
                          {link.isActive ? "Active" : "Off"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-600 truncate mt-0.5">{link.url}</p>
                    </div>
                    <button
                      onClick={() => toggleActive(link.id)}
                      className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition-colors ${link.isActive ? "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20" : "text-slate-500 bg-slate-500/10 hover:bg-slate-500/20"}`}
                    >
                      {link.isActive ? "ON" : "OFF"}
                    </button>
                    <button
                      onClick={() => setEditingId(link.id)}
                      className="p-1 rounded text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {links.length === 0 && (
        <div className="text-center py-6 text-slate-500 text-xs">
          <Link2 size={24} className="mx-auto mb-2 text-slate-600" />
          No footer links yet. Add links to show in the footer.
        </div>
      )}

      {/* Add new link */}
      {showAddForm ? (
        <div className="bg-[#0A0F1E] border border-[#1E293B] rounded-lg p-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-slate-400 mb-1">Group</label>
              <select
                value={form.group}
                onChange={(e) => setForm({ ...form, group: e.target.value })}
                className="w-full bg-[#111827] border border-[#1E293B] text-white rounded px-3 py-1.5 text-xs focus:border-amber-500/50 outline-none appearance-none cursor-pointer"
              >
                {FOOTER_GROUPS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-slate-400 mb-1">Label</label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className="w-full bg-[#111827] border border-[#1E293B] text-white rounded px-3 py-1.5 text-xs focus:border-amber-500/50 outline-none"
                placeholder="e.g. New Arrivals"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-slate-400 mb-1">URL</label>
            <div className="flex gap-2">
              {isCustomUrl ? (
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="flex-1 bg-[#111827] border border-[#1E293B] text-white rounded px-3 py-1.5 text-xs focus:border-amber-500/50 outline-none"
                  placeholder="/your-custom-path"
                />
              ) : (
                <select
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  className="flex-1 bg-[#111827] border border-[#1E293B] text-white rounded px-3 py-1.5 text-xs focus:border-amber-500/50 outline-none appearance-none cursor-pointer"
                >
                  <option value="">Select a path</option>
                  {AVAILABLE_PATHS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label} ({p.value})</option>
                  ))}
                </select>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsCustomUrl(!isCustomUrl);
                  setCustomUrl("");
                  setForm({ ...form, url: "" });
                }}
                className="px-2 py-1 text-[10px] font-bold rounded bg-slate-500/15 text-slate-400 hover:text-white transition-colors whitespace-nowrap"
              >
                {isCustomUrl ? "Pick" : "Custom"}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-3 h-3 rounded border-[#1E293B] bg-[#0A0F1E] text-amber-500 focus:ring-amber-500/50"
              />
              <span className="text-[11px] text-slate-400">Active</span>
            </label>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="text-[10px] text-slate-600">Order:</span>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                className="w-14 bg-[#111827] border border-[#1E293B] text-white rounded px-2 py-1 text-xs focus:border-amber-500/50 outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => { setShowAddForm(false); setIsCustomUrl(false); setCustomUrl(""); }}
              className="px-3 py-1.5 text-[11px] text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={saving}
              className="flex items-center gap-1.5 bg-amber-500 text-[#0A0F1E] px-3 py-1.5 rounded-lg text-[11px] font-semibold hover:bg-amber-400 disabled:opacity-50 transition-colors"
            >
              <Plus size={12} />
              {saving ? "Adding..." : "Add Link"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-[#1E293B] rounded-lg text-xs text-slate-500 hover:text-amber-400 hover:border-amber-500/30 transition-colors"
        >
          <Plus size={14} />
          Add Footer Link
        </button>
      )}
    </div>
  );
}

/* ─── Section configs ─── */
const SECTIONS: Array<{
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  badge?: string;
  fields?: FieldDef[];
}> = [
  {
    id: "invoice",
    icon: FileText,
    title: "Invoice & Business Details",
    description: "Shown on printed invoices — GSTIN, business address, etc.",
    badge: "Invoices",
    fields: [
      { key: "business_name", label: "Business / Legal Name", placeholder: "ShopSphere Retail Pvt. Ltd." },
      { key: "gstin", label: "GSTIN", placeholder: "22ABCDE1234F1Z5", hint: "15-digit GST identification number" },
      { key: "business_address", label: "Business Address", placeholder: "Shop No. 12, MG Road, Mumbai, Maharashtra 400001", type: "textarea" as const },
      { key: "business_phone", label: "Business Phone", placeholder: "+91 98765 43210" },
      { key: "business_email", label: "Business Email", placeholder: "support@shopsphere.com" },
      { key: "invoice_notes", label: "Invoice Footer Notes", placeholder: "Goods once sold will not be taken back or exchanged unless defective.", type: "textarea" as const },
    ],
  },
  {
    id: "social",
    icon: Share2,
    title: "Social Media Links",
    description: "Footer social icons — paste full URLs",
    badge: "4 links",
    fields: [
      { key: "social_facebook", label: "Facebook", placeholder: "https://facebook.com/yourpage" },
      { key: "social_instagram", label: "Instagram", placeholder: "https://instagram.com/yourpage" },
      { key: "social_twitter", label: "Twitter / X", placeholder: "https://x.com/yourpage" },
      { key: "social_youtube", label: "YouTube", placeholder: "https://youtube.com/yourchannel" },
    ],
  },
  {
    id: "footer",
    icon: LayoutPanelLeft,
    title: "Footer Content",
    description: "Site name, tagline, and copyright text in the footer",
    fields: [
      { key: "site_name", label: "Site Name", placeholder: "ShopSphere" },
      { key: "footer_tagline", label: "Footer Tagline", placeholder: "Premium marketplace...", type: "rich" as const },
      { key: "copyright_text", label: "Copyright Text", placeholder: "All Rights Reserved." },
    ],
  },
  {
    id: "footer_links",
    icon: Link2,
    title: "Footer Links",
    description: "Manage navigation links shown in the footer (Shop, Customer, Support)",
    badge: "Dynamic",
  },
  {
    id: "about",
    icon: Info,
    title: "About Section",
    description: "Content shown on the About page and footer",
    fields: [
      { key: "about_heading", label: "Heading", placeholder: "About ShopSphere" },
      { key: "about_text", label: "About Text", placeholder: "Tell customers about your brand...", type: "rich" as const },
    ],
  },
  {
    id: "announcement",
    icon: Megaphone,
    title: "Announcement Bar",
    description: "Scrolling marquee at the top of every page",
    badge: "Top bar",
    fields: [
      { key: "announcement_text", label: "Text", placeholder: "Free Shipping On Orders Above ₹1999", hint: "Displays as a scrolling marquee in the top bar" },
      { key: "announcement_enabled", label: "Enabled", placeholder: "true", hint: "Type \"true\" to show, anything else to hide" },
    ],
  },
  {
    id: "ticker",
    icon: AlignLeft,
    title: "Homepage Ticker",
    description: "Scrolling bar below the hero banner",
    fields: [
      { key: "ticker_texts", label: "Ticker Items", placeholder: "Free shipping over ₹999|New arrivals weekly|Easy 30-day returns", type: "textarea" as const, hint: "Separate each item with | (pipe)" },
    ],
  },
  {
    id: "contact",
    icon: Phone,
    title: "Contact Information",
    description: "Email, phone, and address on the Contact Us page",
    fields: [
      { key: "contact_email", label: "Email Address", placeholder: "support@shopsphere.com" },
      { key: "contact_phone", label: "Phone Number", placeholder: "+91 98765 43210" },
      { key: "contact_address", label: "Address", placeholder: "Mumbai, Maharashtra, India" },
    ],
  },
  {
    id: "hours",
    icon: Clock,
    title: "Business Hours",
    description: "Per-day hours shown on the Contact Us page",
    badge: "7 days",
  },
  {
    id: "products_display",
    icon: LayoutPanelLeft,
    title: "Products Display",
    description: "Control how many products show per page before 'View More'",
    badge: "Pagination",
    fields: [
      {
        key: "products_per_page",
        label: "Products per page (View More batch size)",
        placeholder: "12",
        hint: "Number of products loaded initially and per 'View More' click. Choose 3, 6, 9, 12, 15, 18, or 24.",
        type: "select" as const,
        options: ["3", "6", "9", "12", "15", "18", "24"],
      },
    ],
  },
  {
    id: "admin_notifications",
    icon: Bell,
    title: "Admin Notifications",
    description: "Get notified on WhatsApp when customers place orders or send queries",
    badge: "Alerts",
    fields: [
      {
        key: "admin_phone",
        label: "Admin WhatsApp / Phone Number",
        placeholder: "919876543210",
        hint: "Include country code without + (e.g. 919876543210 for India). This number receives WhatsApp alerts for every new order, product query, contact message, and callback request.",
      },
      {
        key: "notify_on_order",
        label: "New Order Alerts",
        placeholder: "true",
        type: "toggle" as const,
        hint: "Receive WhatsApp notification when a customer places a new order (COD or Online).",
      },
      {
        key: "notify_on_query",
        label: "Product Query Alerts",
        placeholder: "true",
        type: "toggle" as const,
        hint: "Receive WhatsApp notification when a customer asks a product question.",
      },
      {
        key: "notify_on_contact",
        label: "Contact / Callback Alerts",
        placeholder: "true",
        type: "toggle" as const,
        hint: "Receive WhatsApp notification on contact form submissions and callback requests.",
      },
    ],
  },
];

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => setSettings(data))
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateField = useCallback((key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center py-20">
        <Loader2 size={24} className="text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#0A0F1E] border-b border-[#1E293B]">
        <div>
          <h1 className="text-2xl font-bold text-white">Site Settings</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your store&apos;s public information</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-amber-500 text-[#0A0F1E] px-5 py-2 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? "Saving\u2026" : "Save All"}
        </button>
      </div>

      <div className="space-y-3 p-6">
        {SECTIONS.map((section) => (
          <AccordionSection
            key={section.id}
            icon={section.icon}
            title={section.title}
            description={section.description}
            badge={section.badge}
            defaultOpen={section.id === "hours"}
          >
            {section.id === "hours" ? (
              <BusinessHoursEditor
                value={settings.business_hours || ""}
                onChange={(val) => updateField("business_hours", val)}
              />
            ) : section.id === "footer_links" ? (
              <FooterLinksEditor />
            ) : section.id === "admin_notifications" ? (
              <div>
                {/* Workflow guide */}
                <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageCircle size={16} className="text-amber-400" />
                    <h4 className="text-sm font-bold text-amber-400">How Admin Notifications Work</h4>
                  </div>
                  <div className="space-y-2 text-[13px] text-slate-400 leading-relaxed">
                    <p>When a customer performs any of the actions below, you&apos;ll receive an <strong className="text-slate-300">instant WhatsApp message</strong> on the phone number above — even if you&apos;re not at your computer.</p>
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                        <span><strong className="text-slate-300">New Order</strong> — You&apos;ll get order number, customer name, amount, and payment method (COD/Online).</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                        <span><strong className="text-slate-300">Product Query</strong> — Customer asks a question about a product. You can reply from Admin &gt; Product Queries.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                        <span><strong className="text-slate-300">Contact / Callback</strong> — Customer submits a contact form or requests a callback.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                        <span><strong className="text-slate-300">Returns &amp; Replacements</strong> — When a customer requests a return or replacement.</span>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">Requires WhatsApp Business API credentials (<code className="text-amber-400/70">WHATSAPP_API_TOKEN</code> and <code className="text-amber-400/70">WHATSAPP_PHONE_NUMBER_ID</code>) in your environment variables. If not configured, in-app notifications still work via the bell icon above.</p>
                  </div>
                </div>

                <div className="space-y-5">
                  {section.fields!.map((field) => (
                    <FieldInput
                      key={field.key}
                      field={field}
                      value={settings[field.key] || ""}
                      onChange={(val) => updateField(field.key, val)}
                    />
                  ))}
                </div>
              </div>
            ) : "fields" in section ? (
              <div className="space-y-5">
                {section.fields!.map((field) => (
                  <FieldInput
                    key={field.key}
                    field={field}
                    value={settings[field.key] || ""}
                    onChange={(val) => updateField(field.key, val)}
                  />
                ))}
              </div>
            ) : null}
          </AccordionSection>
        ))}
      </div>
    </div>
  );
}
