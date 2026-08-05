import Link from "next/link";
import { Plus } from "lucide-react";

interface Props {
  title: string;
  buttonText: string;
  buttonLink: string;
}

export default function TableHeader({
  title,
  buttonText,
  buttonLink,
}: Props) {
  return (
    <div className="flex items-center justify-between mb-8">

      <div>

        <h1 className="text-3xl font-black text-white">
          {title}
        </h1>

        <p className="text-slate-400 mt-2">
          Manage all {title.toLowerCase()}
        </p>

      </div>

      <Link
        href={buttonLink}
        className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold"
        style={{
          background: "#F59E0B",
          color: "#111827",
        }}
      >
        <Plus size={18} />
        {buttonText}
      </Link>

    </div>
  );
}