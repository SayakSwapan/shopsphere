interface Props {
  children: React.ReactNode;
}

export default function PageContainer({
  children,
}: Props) {
  return (
    <div className="max-w-[1600px] mx-auto space-y-8">
      {children}
    </div>
  );
}