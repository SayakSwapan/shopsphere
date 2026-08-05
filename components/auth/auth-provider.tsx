"use client";

import { AuthProviderContext } from "./auth-context";
import AuthModal from "./auth-modal";

interface Props {
  children: React.ReactNode;
}

export default function AuthProvider({
  children,
}: Props) {
  return (
    <AuthProviderContext>
      {children}

      {/* Global Login/Register Modal */}
      <AuthModal />
    </AuthProviderContext>
  );
}