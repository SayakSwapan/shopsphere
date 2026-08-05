import { prisma } from "@/lib/prisma";
import { Truck, ShieldCheck, RotateCcw, CreditCard, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  "FREE RETURNS": RotateCcw,
  "OFFICIAL": ShieldCheck,
  "SAME-DAY": Zap,
  "SECURE": CreditCard,
  "DISPATCH": Truck,
  "FREE": RotateCcw,
};

function pickIcon(text: string) {
  for (const [key, Icon] of Object.entries(ICON_MAP)) {
    if (text.toUpperCase().includes(key)) return Icon;
  }
  return Truck;
}

export default async function PromoStrip() {
  const row = await prisma.siteSetting.findUnique({
    where: { key: "promo_strip_items" },
  });

  if (!row?.value) return null;

  const items = row.value
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!items.length) return null;

  const doubled = [...items, ...items];

  return (
    <div
      className="overflow-hidden"
      style={{ background: "var(--t-bg-card)" }}
    >
      <div
        className="flex items-center gap-0 whitespace-nowrap"
        style={{
          animation: "promo-marquee 30s linear infinite",
          width: "max-content",
        }}
      >
        {doubled.map((item, i) => {
          const Icon = pickIcon(item);
          const isHighlight = i % 2 === 0;

          return (
            <div
              key={`${item}-${i}`}
              className="flex items-center gap-2.5 px-6 py-3 border-r"
              style={{ borderColor: "var(--t-border-subtle)" }}
            >
              <Icon
                size={14}
                style={{ color: isHighlight ? "var(--t-accent)" : "var(--t-text-muted-2)" }}
              />
              <span
                className="text-[11px] font-black uppercase tracking-[0.15em]"
                style={{
                  color: isHighlight ? "var(--t-accent)" : "var(--t-text-muted-2)",
                  fontFamily: "var(--t-font-heading)",
                }}
              >
                {item}
              </span>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes promo-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
