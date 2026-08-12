import { ChevronDown } from "lucide-react";

interface SectionAccordionProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

/**
 * Collapsible section for mobile — content is hidden behind the header on
 * small screens and always expanded on sm+ (checkbox/peer pattern, no JS).
 */
export default function ProductSectionAccordion({
  id,
  title,
  children,
}: SectionAccordionProps) {
  return (
    <div className="pd-card relative overflow-hidden">
      <input type="checkbox" id={id} className="peer sr-only" />

      <label
        htmlFor={id}
        className="flex cursor-pointer items-center gap-3 p-5 sm:cursor-default sm:p-8"
      >
        <h2
          className="pd-title-bar text-sm sm:text-base font-black uppercase tracking-[0.2em] text-text-heading"
          style={{ fontFamily: "var(--t-font-heading)" }}
        >
          {title}
        </h2>
      </label>

      <ChevronDown
        size={18}
        strokeWidth={3}
        className="pointer-events-none absolute right-5 top-5 transition-transform duration-300 peer-checked:rotate-180 sm:hidden"
        style={{ color: "var(--t-text-muted-2)" }}
      />

      <div className="hidden px-5 pb-6 peer-checked:block sm:block sm:px-8 sm:pb-8">
        {children}
      </div>
    </div>
  );
}
