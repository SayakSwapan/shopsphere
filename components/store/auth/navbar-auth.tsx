"use client";

import { useSession } from "next-auth/react";
import UserMenu from "./user-menu";
import { openAuthModal } from "@/lib/auth-model";

export default function NavbarAuth() {
    const { data: session } =
        useSession();

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
            onClick={openAuthModal}
        >
            Login
        </button>
    );
}