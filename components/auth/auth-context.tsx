"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

type AuthMode = "login" | "register";
interface AuthContextType{

open:boolean;

mode:"login"|"register";

openAuth:(mode:"login"|"register")=>void;

closeAuth:()=>void;

switchMode:(mode:"login"|"register")=>void;

}

const AuthContext =
  createContext<
    AuthContextType | undefined
  >(undefined);

export function AuthProviderContext({
  children,
}: {
  children: ReactNode;
}) {
  const [open, setOpen] =
    useState(false);

  const [mode, setMode] =
    useState<AuthMode>(
      "login"
    );

  function openAuth(
    newMode: AuthMode
  ) {
    setMode(newMode);
    setOpen(true);
  }

  function closeAuth() {
    setOpen(false);
  }

  function switchMode(
    newMode: AuthMode
  ) {
    setMode(newMode);
  }

  return (
    <AuthContext.Provider
      value={{
        open,
        mode,
        openAuth,
        closeAuth,
        switchMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Strict hook (for components that REQUIRE provider)
export function useAuthModal() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuthModal must be used inside AuthProvider"
    );
  }

  return context;
}
// Optional hook (for components that can work without provider)
export function useOptionalAuthModal() {
  return useContext(AuthContext);
}