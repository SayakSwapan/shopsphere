"use client";

import Modal from "@/components/common/modal";
import { useAuthModal } from "./auth-context";
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

  return (
    <Modal
      open={open}
      onClose={closeAuth}
      maxWidth="max-w-lg"
    >
      <div className="relative overflow-hidden">

        {/* Background */}

        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg,#0A0F1E 0%,#0D1424 45%,#111827 100%)",
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
            background: "#F5A623",
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
          hover:bg-white/10
          "
        >
          <X
            className="text-white"
            size={20}
          />
        </button>

        <div className="relative z-10 p-10">

          <p
            className="text-xs uppercase tracking-[0.35em]"
            style={{
              color: "#F5A623",
            }}
          >
            Welcome to
          </p>

          <h1
            className="mt-2 text-4xl font-black"
            style={{
              color: "#FFFFFF",
            }}
          >
            Shop
            <span
              style={{
                color: "#F5A623",
              }}
            >
              Sphere
            </span>
          </h1>

          <p className="mt-3 text-sm text-slate-400">
            Premium fashion for everyone.
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

                    <span className="text-slate-400">
                      Do not have an account?
                    </span>

                    <button
                      onClick={() =>
                        switchMode(
                          "register"
                        )
                      }
                      className="ml-2 font-bold text-amber-400 hover:text-amber-300"
                    >
                      Create Account
                    </button>

                  </div>
                </>
              ) : (
                <>
                  <RegisterForm />

                  <div className="mt-8 text-center">

                    <span className="text-slate-400">
                      Already have an account?
                    </span>

                    <button
                      onClick={() =>
                        switchMode(
                          "login"
                        )
                      }
                      className="ml-2 font-bold text-amber-400 hover:text-amber-300"
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