import { auth } from "@/lib/auth";

export default async function LoginStatus() {
  const session =
    await auth();

  if (!session?.user)
    return null;

  return (
    <div
      className="
      fixed
      bottom-5
      right-5
      px-4
      py-2
      rounded-full
      z-50
      "
      style={{
        background:
          "rgba(34,197,94,.15)",
        border:
          "1px solid rgba(34,197,94,.25)",
        color: "#22c55e",
      }}
    >
      Logged in as{" "}
      <b>
        {session.user.name}
      </b>
    </div>
  );
}