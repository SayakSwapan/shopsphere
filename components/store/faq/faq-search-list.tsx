"use client";

import { useMemo, useState } from "react";
import { HelpCircle, Search, MessageCircle } from "lucide-react";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const ACCORDION_THEME = {
  card: {
    borderRadius: "var(--t-radius-card)",
    borderColor: "var(--t-border-card)",
    background: "var(--t-bg-card)",
    boxShadow: "var(--t-shadow-card)",
  },
  cardHover: "var(--t-shadow-card-hover)",
  question: "var(--t-text-heading)",
  answer: "var(--t-text-body)",
  muted: "var(--t-text-muted-2)",
  icon: "var(--t-primary)",
  iconBg: "color-mix(in srgb, var(--t-primary) 12%, transparent)",
};

export default function FaqSearchList({ faqs }: { faqs: FaqItem[] }) {
  const [query, setQuery] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return faqs;
    return faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q)
    );
  }, [query, faqs]);

  return (
    <div className="space-y-10">
      {/* Search */}
      <div
        className="relative max-w-xl mx-auto"
        style={{ borderRadius: "var(--t-radius-input)" }}
      >
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2"
          style={{ color: ACCORDION_THEME.muted }}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpenIndex(e.target.value ? 0 : null);
          }}
          placeholder="Search for a question..."
          aria-label="Search FAQs"
          className="w-full py-4 pl-12 pr-5 text-sm outline-none transition"
          style={{
            borderRadius: "var(--t-radius-input)",
            border: "1px solid var(--t-border-card)",
            background: "var(--t-bg-card)",
            color: "var(--t-text-heading)",
            boxShadow: "var(--t-shadow-card)",
          }}
        />
      </div>

      {/* Results */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.id}
                className="overflow-hidden transition-all duration-200"
                style={{
                  borderRadius: "var(--t-radius-card)",
                  border: `1px solid var(--t-border-card)`,
                  background: "var(--t-bg-card)",
                  boxShadow: isOpen
                    ? "var(--t-shadow-card-hover)"
                    : "var(--t-shadow-card)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center gap-4 px-5 py-4 sm:px-7 text-left select-none"
                  aria-expanded={isOpen}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: ACCORDION_THEME.iconBg,
                      color: ACCORDION_THEME.icon,
                    }}
                  >
                    <HelpCircle size={20} className="text-[var(--t-primary)]" />
                  </span>
                  <span
                    className="flex-1 text-sm font-bold sm:text-base"
                    style={{ color: ACCORDION_THEME.question }}
                  >
                    {faq.question}
                  </span>
                  <span
                    className={`shrink-0 text-xl leading-none transition-transform duration-200 ${
                      isOpen ? "rotate-45" : ""
                    }`}
                    style={{ color: ACCORDION_THEME.icon }}
                  >
                    +
                  </span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 sm:px-7 pl-14 sm:pl-20">
                    <div
                      className="border-l-2 pl-5"
                      style={{
                        borderColor: "color-mix(in srgb, var(--t-primary) 40%, transparent)",
                      }}
                    >
                      <p
                        className="text-sm leading-relaxed whitespace-pre-line"
                        style={{ color: ACCORDION_THEME.answer }}
                      >
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="rounded-xl border p-10 sm:p-14 text-center"
          style={{
            borderRadius: "var(--t-radius-card)",
            borderColor: "var(--t-border-card)",
            background: "var(--t-bg-card)",
          }}
        >
          <MessageCircle
            size={40}
            className="mx-auto mb-4 text-[var(--t-text-muted-3)]"
          />
          <p
            className="text-base font-semibold"
            style={{ color: "var(--t-text-heading)" }}
          >
            No results for &ldquo;{query}&rdquo;
          </p>
          <p
            className="mt-2 text-sm"
            style={{ color: "var(--t-text-muted-1)" }}
          >
            Try a different search term, or contact our support team for help.
          </p>
        </div>
      )}
    </div>
  );
}