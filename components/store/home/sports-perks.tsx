"use client";

import { Trophy } from "lucide-react";
import { useTheme } from "@/lib/themes/theme-provider";

const PERKS = [
  { num: "01", title: "Athlete Tested", desc: "Every product trialed by pro teams before release." },
  { num: "02", title: "Fast Dispatch", desc: "Ships same day, arrives in 2 days flat." },
  { num: "03", title: "Performance Guarantee", desc: "Every product vetted by pro athletes before it ships." },
  { num: "04", title: "Club Rewards", desc: "Earn points on every rep, redeem on gear." },
];

export default function SportsPerks() {
  const { themeId } = useTheme();

  if (themeId !== "sports") return null;

  return (
    <section style={{ background: "var(--sports-ink)" }}>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p
              className="mb-2 text-[11px] font-black uppercase tracking-[0.3em]"
              style={{ color: "var(--sports-volt)", fontFamily: "var(--t-font-body)" }}
            >
              Pro Protocol
            </p>
            <h2
              className="text-3xl font-black uppercase leading-none md:text-4xl"
              style={{ fontFamily: "'Anton', sans-serif", color: "#F4F3EE" }}
            >
              Why Athletes <span style={{ color: "var(--sports-volt)" }}>Choose Us</span>
            </h2>
          </div>
          <div
            className="hidden items-center gap-3 md:flex"
            style={{
              border: "1px solid rgba(203,255,62,0.3)",
              background: "rgba(203,255,62,0.06)",
              borderRadius: "var(--t-radius-card)",
              padding: "12px 18px",
            }}
          >
            <Trophy size={18} style={{ color: "var(--sports-volt)" }} />
            <div>
              <p
                className="text-xl font-normal leading-none"
                style={{ fontFamily: "'Anton', sans-serif", color: "#F4F3EE" }}
              >
                50+
              </p>
              <p
                className="text-[10px] font-black uppercase tracking-[0.2em]"
                style={{ color: "rgba(244,243,238,0.55)", fontFamily: "var(--t-font-body)" }}
              >
                Teams Equipped
              </p>
            </div>
          </div>
        </div>

        <div
          className="grid grid-cols-1 gap-px overflow-hidden sm:grid-cols-2 lg:grid-cols-4"
          style={{ background: "rgba(255,255,255,0.08)", borderRadius: "var(--t-radius-card)" }}
        >
          {PERKS.map((perk) => (
            <div
              key={perk.num}
              className="group flex gap-4 items-start p-6 transition-colors duration-300 hover:bg-white/[0.03]"
              style={{ background: "#0E1319" }}
            >
              <span
                className="text-3xl font-normal leading-none transition-colors group-hover:text-[var(--sports-volt)]"
                style={{ fontFamily: "'Anton', sans-serif", color: "rgba(203,255,62,0.55)" }}
              >
                {perk.num}
              </span>
              <div>
                <h4
                  className="text-sm font-extrabold uppercase mb-1.5"
                  style={{ letterSpacing: "1px", fontFamily: "var(--t-font-body)", color: "#F4F3EE" }}
                >
                  {perk.title}
                </h4>
                <p className="text-[13px] leading-relaxed" style={{ color: "#9A9D9F" }}>
                  {perk.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
