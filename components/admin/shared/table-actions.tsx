"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";

interface Props {
  editLink: string;
  onDelete?: () => void;
}

export default function TableActions({
  editLink,
  onDelete,
}: Props) {
  return (
    <div className="flex gap-2">

      <Link
        href={editLink}
        className="p-2 rounded-lg"
        style={{
          background: "#1E293B",
        }}
      >
        <Pencil
          size={16}
          color="#F59E0B"
        />
      </Link>

      <button
        onClick={onDelete}
        className="p-2 rounded-lg"
        style={{
          background: "#1E293B",
        }}
      >
        <Trash2
          size={16}
          color="#EF4444"
        />
      </button>

    </div>
  );
}