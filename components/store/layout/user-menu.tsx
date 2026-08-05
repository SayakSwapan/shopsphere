"use client";

import Link from "next/link";
import { useState } from "react";

import {
  User,
  Package,
  MapPin,
  Heart,
  LogOut,
  ChevronDown,
} from "lucide-react";

export default function UserMenu() {
  const [open, setOpen] =
    useState(false);

  return (
    <div className="relative">

      <button
        onClick={() =>
          setOpen(!open)
        }
        className="
        flex
        items-center
        gap-2
        px-3
        py-2.5
        hover:bg-zinc-100
        transition-all
        "
      >
        <User size={20} />

        <span className="hidden md:block font-semibold">
          My Account
        </span>

        <ChevronDown
          size={16}
        />
      </button>

      {open && (
        <div
          className="
          absolute
          right-0
          mt-3
          w-64
          bg-bg-card
          border
          border-border-card
          shadow-xl
          z-50
          "
        >

          <div className="p-4 border-b">

            <h3 className="font-bold">
              Welcome Back
            </h3>

            <p className="text-sm text-zinc-500">
              Customer Account
            </p>

          </div>

          <div className="py-2">

            <Link
              href="/account/profile"
              className="
              flex
              items-center
              gap-3
              px-4
              py-3
              hover:bg-zinc-50
              "
            >
              <User size={18} />
              My Profile
            </Link>

            <Link
              href="/account/orders"
              className="
              flex
              items-center
              gap-3
              px-4
              py-3
              hover:bg-zinc-50
              "
            >
              <Package size={18} />
              My Orders
            </Link>

            <Link
              href="/account/addresses"
              className="
              flex
              items-center
              gap-3
              px-4
              py-3
              hover:bg-zinc-50
              "
            >
              <MapPin size={18} />
              Saved Addresses
            </Link>

            <Link
              href="/wishlist"
              className="
              flex
              items-center
              gap-3
              px-4
              py-3
              hover:bg-zinc-50
              "
            >
              <Heart size={18} />
              Wishlist
            </Link>

          </div>

          <div className="border-t">

            <button
              className="
              w-full
              flex
              items-center
              gap-3
              px-4
              py-4
              text-red-600
              hover:bg-red-50
              "
            >
              <LogOut size={18} />
              Logout
            </button>

          </div>

        </div>
      )}

    </div>
  );
}