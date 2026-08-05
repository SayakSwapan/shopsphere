"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import ThemeCard from "@/components/admin/theme-decider/theme-card";
import ThemePreviewFrame from "@/components/admin/theme-decider/theme-preview-frame";
import type { ThemeId, ThemeTokens } from "@/lib/themes/config";

interface ThemeData {
  active: ThemeId;
  themes: ThemeTokens[];
}

export default function ThemeDeciderPage() {
  const [data, setData] = useState<ThemeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewTheme, setPreviewTheme] = useState<ThemeId>("luxury");

  useEffect(() => {
    fetch("/api/admin/theme")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setData(d.data);
          setPreviewTheme(d.data.active);
        } else {
          toast.error("Failed to load themes.");
        }
      })
      .catch(() => toast.error("Failed to load themes."))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (id: string) => {
    setPreviewTheme(id as ThemeId);
    setData((prev) => (prev ? { ...prev, active: id as ThemeId } : prev));
  };

  if (loading) {
    return <div className="p-8 text-slate-400">Loading themes...</div>;
  }

  if (!data) {
    return <div className="p-8 text-red-400">Failed to load themes.</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">Theme Decider</h1>
        <p className="mt-1 text-sm text-slate-500">
          Choose a theme for your storefront. Changes apply instantly to all customers.
        </p>
      </div>

      {/* Theme cards grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {data.themes.map((theme) => (
          <div
            key={theme.id}
            onMouseEnter={() => setPreviewTheme(theme.id)}
          >
            <ThemeCard
              theme={theme}
              isActive={data.active === theme.id}
              onSelect={handleSelect}
            />
          </div>
        ))}
      </div>

      {/* Live preview */}
      <ThemePreviewFrame themeId={previewTheme} />
    </div>
  );
}
