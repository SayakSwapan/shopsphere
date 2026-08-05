"use client";

import { Trash2 } from "lucide-react";

interface Props {
  onClick: () => void;
}

export default function TrashButton({
  onClick,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-red-500 hover:text-red-400"
    >
      <Trash2 size={18} />
    </button>
  );
}