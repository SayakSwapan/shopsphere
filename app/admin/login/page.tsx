import LoginForm from "@/components/admin/login-form";

export default function AdminLoginPage() {
  
  return (
    <main
      className="min-h-screen flex items-center justify-center px-6"
      style={{
        background:
          "linear-gradient(135deg,#0B1120 0%,#111827 60%,#1E293B 100%)",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: "blur(20px)",
          background:
            "radial-gradient(circle at top right, rgba(245,158,11,.08), transparent 35%)",
        }}
      />

      <LoginForm />
    </main>
  );
}