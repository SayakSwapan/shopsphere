import { prisma } from "@/lib/prisma";
import { Zap } from "lucide-react";

export const dynamic = "force-dynamic";

const FALLBACK_PHRASES = [
  "Train Hard",
  "Play Pro",
  "Authentic Gear",
  "Same-Day Ship",
  "Built To Last",
  "Game Day Ready",
  "Team Verified",
  "Zero Compromise",
];

export default async function SportsMarquee() {
  let phrases: string[] = [];
  try {
    const items = await prisma.sportsMarqueeItem.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { phrase: true },
    });
    phrases = items.map((i) => i.phrase).filter(Boolean);
  } catch {
    phrases = [];
  }

  if (!phrases.length) phrases = FALLBACK_PHRASES;
  const doubled = [...phrases, ...phrases];

  return (
    <div className="relative overflow-hidden" style={{ background: "var(--sports-volt)" }}>
      <div
        className="flex w-max items-center whitespace-nowrap"
        style={{ animation: "sports-marquee 26s linear infinite" }}
      >
        {doubled.map((phrase, i) => (
          <span
            key={i}
            className="flex items-center gap-5 px-6 py-3.5"
          >
            <span
              className="text-sm font-black uppercase tracking-[0.18em]"
              style={{ fontFamily: "'Anton', sans-serif", color: "var(--sports-ink)" }}
            >
              {phrase}
            </span>
            <Zap size={15} fill="var(--sports-ink)" className="shrink-0 opacity-40" />
          </span>
        ))}
      </div>
      {/* top/bottom hairlines */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: "rgba(10,14,19,0.35)" }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
        style={{ background: "rgba(10,14,19,0.35)" }}
      />
    </div>
  );
}
