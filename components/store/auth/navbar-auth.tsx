"use client";

import { useSession } from "next-auth/react";
import UserMenu from "./user-menu";
import { useOptionalAuthModal } from "@/components/auth/auth-context";

export default function NavbarAuth() {
    const { data: session } =
        useSession();
    const authModal = useOptionalAuthModal();

    if (session?.user) {
        return (
            <UserMenu
                name={session?.user?.name ?? ""}
                email={session?.user?.email ?? ""}
            />
        );
    }

    return (
        <button
            onClick={() => authModal?.openAuth("login")}
            className="flex min-h-[44px] items-center justify-center px-5 font-bold uppercase transition-colors"
            style={{
                color: "var(--t-primary)",
                border: "1px solid var(--t-border-card)",
                borderRadius: "var(--t-radius-button)",
                fontFamily: "var(--t-font-heading)",
            }}
        >
            Login
        </button>
    );
}