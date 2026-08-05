export default function MotifDivider() {
  return (
    <div className="flex items-center justify-center gap-3 py-9" style={{ background: "var(--t-bg-page)" }}>
      <div className="w-20 h-[1px]" style={{ background: "#D8C39B" }} />
      <div
        className="w-2 h-2"
        style={{ background: "#C9972F", transform: "rotate(45deg)" }}
      />
      <div className="w-20 h-[1px]" style={{ background: "#D8C39B" }} />
    </div>
  );
}
