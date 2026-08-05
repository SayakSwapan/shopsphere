interface Props {
  children: React.ReactNode;

  onClick?: () => void;

  type?: "button" | "submit";

  href?: string;

  className?: string;
}

export default function PrimaryButton({
  children,
  type = "button",
  onClick,
  className = "",
}: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`primary-btn px-6 py-3 rounded-2xl font-semibold shadow-lg ${className}`}
    >
      {children}
    </button>
  );
}