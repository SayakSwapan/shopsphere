import { prisma } from "@/lib/prisma";
import { Shield, Truck, RotateCcw, Headphones } from "lucide-react";

export const dynamic = "force-dynamic";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  shield: Shield,
  truck: Truck,
  shipping: Truck,
  return: RotateCcw,
  refund: RotateCcw,
  support: Headphones,
  help: Headphones,
};

function getIcon(icon?: string | null) {
  if (!icon) return Shield;
  const key = icon.toLowerCase();
  return ICON_MAP[key] || Shield;
}

export default async function TrustBar() {
  const [trustItems, stats] = await Promise.all([
    prisma.trustItem.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 4,
    }),
    prisma.statCounter.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 4,
    }),
  ]);

  if (!trustItems.length && !stats.length) return null;

  return (
    <section
      style={{ background: "var(--t-bg-card)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* stat counters */}
        {stats.length > 0 && (
          <div             className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 sm:mb-16">
            {stats.map((stat) => (
              <div key={stat.id} className="text-center">
                <p
                  className="text-2xl md:text-4xl font-black"
                  style={{ color: "var(--t-primary)", fontFamily: "var(--t-font-heading)" }}
                >
                  {stat.value}
                </p>
                <p
                  className="text-xs font-bold uppercase tracking-wider mt-2"
                  style={{ color: "var(--t-text-muted-2)", fontFamily: "var(--t-font-heading)" }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* trust items */}
        {trustItems.length > 0 && (
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-10 border-t"
            style={{ borderColor: "var(--t-border-subtle)" }}
          >
            {trustItems.map((item) => {
              const Icon = getIcon(item.icon);
              return (
                <div
                  key={item.id}
                  className="flex flex-col items-center text-center gap-4 p-5 md:p-6"
                >
                  <div
                    className="w-14 h-14 flex items-center justify-center"
                    style={{
                      background: "color-mix(in srgb, var(--t-primary) 12%, transparent)",
                      borderRadius: "50%",
                    }}
                  >
                    <Icon size={24} style={{ color: "var(--t-primary)" }} />
                  </div>
                  <div>
                    <h4
                      className="text-xs font-black uppercase tracking-wider mb-1"
                      style={{ color: "var(--t-text-heading)", fontFamily: "var(--t-font-heading)" }}
                    >
                      {item.title}
                    </h4>
                    {item.subtitle && (
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: "var(--t-text-muted-2)" }}
                      >
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
