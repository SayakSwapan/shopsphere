interface Props {
  children: React.ReactNode;
}

export default function Container({
  children,
}: Props) {
  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
      {children}
    </div>
  );
}