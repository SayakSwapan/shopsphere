import Link from "next/link";

interface Props {
  title: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
}

export default function PageHeader({
  title,
  subtitle,
  buttonText,
  buttonLink,
}: Props) {
  return (
    <div className="flex items-center justify-between mb-8">

      <div>

        <h1 className="text-3xl font-black text-white">
          {title}
        </h1>

        <p className="text-slate-400 mt-1">
          {subtitle}
        </p>

      </div>

      {buttonText && buttonLink && (
        <Link
          href={buttonLink}
          className="px-6 py-3 rounded-xl font-bold"
          style={{
            background: "#F59E0B",
            color: "#111827",
          }}
        >
          {buttonText}
        </Link>
      )}

    </div>
  );
}