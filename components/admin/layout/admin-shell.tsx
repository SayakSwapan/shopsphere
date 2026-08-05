"use client";

import { useState } from "react";
import AdminSidebar from "./admin-sidebar";
import AdminTopbar from "./admin-topbar";
import Breadcrumb from "../breadcrumb";
import LoadingProvider from "../common/loading-provider";
import GuideButton from "../guides/guide-button";

export default function AdminShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
  };
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <LoadingProvider>
      <div
        className="flex"
        style={{
          background:
            "radial-gradient(1100px 520px at 85% -10%, rgba(245,158,11,0.07), transparent 60%)," +
            "radial-gradient(900px 460px at 0% 110%, rgba(99,102,241,0.06), transparent 60%)," +
            "#0A0F1E",
        }}
      >
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
        </div>

        <div className="flex-1 min-h-screen min-w-0">
          <AdminTopbar user={user} onMenuToggle={() => setSidebarOpen(true)} />

          <main className="p-4 sm:p-6 lg:p-8">
            <Breadcrumb />
            {children}
          </main>
        </div>

        {/* Per-page floating guide button */}
        <GuideButton />
      </div>
    </LoadingProvider>
  );
}
