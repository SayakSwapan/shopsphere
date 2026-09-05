import LoginForm from "@/components/admin/login-form";

export default function AdminLoginPage() {
  return (
    <main
      className="relative min-h-screen flex items-center justify-center px-6 py-10 overflow-hidden"
      style={{
        background:
          "linear-gradient(150deg, #0A0F1E 0%, #111827 45%, #0B1220 100%)",
      }}
    >
      {/* Ambient glows */}
      <div
        className="pointer-events-none absolute -top-32 -right-24 h-[480px] w-[480px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(245,158,11,.14), transparent 65%)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-24 h-[420px] w-[420px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(245,158,11,.08), transparent 65%)",
        }}
      />
      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at center, #000 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, #000 30%, transparent 75%)",
        }}
      />

      <LoginForm />
    </main>
  );
}