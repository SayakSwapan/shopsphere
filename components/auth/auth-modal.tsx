"use client";

import Modal from "@/components/common/modal";
import { useAuthModal } from "./auth-context";
import { useSiteName } from "@/components/store/site-settings-provider";
import SiteBrand from "@/components/brand/site-brand";
import LoginForm from "./login-form";
import RegisterForm from "./register-form";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AuthModal() {
  const {
    open,
    mode,
    closeAuth,
    switchMode,
  } = useAuthModal();

  const siteName = useSiteName();

  return (
    <Modal
      open={open}
      onClose={closeAuth}
      maxWidth="max-w-lg"
    >
      <div className="relative overflow-hidden rounded-[inherit] bg-bg-card">

        {/* Background */}

        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, var(--t-bg-card) 0%, var(--t-bg-card-alt) 45%, var(--t-bg-page) 100%)",
          }}
        />

        {/* Glow */}

        <div
          className="
          absolute
          -top-28
          -right-28
          h-72
          w-72
          rounded-full
          blur-[120px]
          opacity-20
          "
          style={{
            background: "var(--t-primary)",
          }}
        />

        {/* Close */}

        <button
          onClick={closeAuth}
          className="
          absolute
          top-5
          right-5
          z-20
          rounded-full
          p-2
          transition
          hover:bg-bg-card-alt
          text-text-heading
          "
        >
          <X
            size={20}
          />
        </button>

        <div className="relative z-10 max-h-[calc(100dvh-3rem)] overflow-y-auto p-6 sm:p-10">

          <p
            className="text-xs uppercase tracking-[0.35em]"
            style={{
              color: "var(--t-primary)",
            }}
          >
            Welcome to
          </p>

          <h1
            className="mt-2 text-3xl sm:text-4xl font-black"
            style={{
              color: "var(--t-text-heading)",
              fontFamily: "var(--t-font-heading)",
            }}
          >
            <SiteBrand name={siteName} />
          </h1>

          <p className="mt-3 text-sm text-text-muted-1">
            Premium shopping, made for you.
          </p>

          <AnimatePresence mode="wait">

            <motion.div
              key={mode}
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -20,
              }}
              transition={{
                duration: 0.25,
              }}
              className="mt-10"
            >
              {mode ===
              "login" ? (
                <>
                  <LoginForm />

                  <div className="mt-8 text-center">

                    <span className="text-text-muted-1">
                      Do not have an account?
                    </span>

                    <button
                      onClick={() =>
                        switchMode(
                          "register"
                        )
                      }
                      className="ml-2 font-bold text-primary hover:opacity-80"
                    >
                      Create Account
                    </button>

                  </div>
                </>
              ) : (
                <>
                  <RegisterForm />

                  <div className="mt-8 text-center">

                    <span className="text-text-muted-1">
                      Already have an account?
                    </span>

                    <button
                      onClick={() =>
                        switchMode(
                          "login"
                        )
                      }
                      className="ml-2 font-bold text-primary hover:opacity-80"
                    >
                      Login
                    </button>

                  </div>
                </>
              )}
            </motion.div>

          </AnimatePresence>

        </div>

      </div>
    </Modal>
  );
}
