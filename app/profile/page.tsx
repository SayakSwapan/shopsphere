import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session =
    await auth();

  if (!session) {
    redirect("/");
  }

  return (
    <div
      className="
      min-h-screen
      bg-[#0A0F1E]
      text-white
      p-10
      "
    >
      <h1
        className="
        text-4xl
        font-black
        "
      >
        My Profile
      </h1>

      <div
        className="
        mt-8
        bg-[#111827]
        border
        border-[#F5A623]
        rounded-2xl
        p-6
        "
      >
        <p>
          Name:
          {" "}
          {
            session.user?.name
          }
        </p>

        <p>
          Email:
          {" "}
          {
            session.user?.email
          }
        </p>

        <p>
          Role:
          {" "}
          {
            (
              session.user as {
                role?: string;
              }
            ).role
          }
        </p>
      </div>
    </div>
  );
}