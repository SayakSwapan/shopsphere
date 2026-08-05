"use client";

import FilterableTable from "@/components/admin/common/filterable-table";
import { FaqRow, faqHeaders } from "@/components/admin/faqs/faq-columns";

interface Faq {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export default function FaqsTable({ faqs }: { faqs: Faq[] }) {
  return (
    <FilterableTable
      data={faqs}
      searchFields={["question", "answer"]}
      headers={faqHeaders}
      filters={[
        { key: "isActive", label: "Status", options: [{ value: "true", label: "Active" }, { value: "false", label: "Inactive" }] },
      ]}
      renderRow={(faq) => <FaqRow key={faq.id} faq={faq} />}
    />
  );
}
