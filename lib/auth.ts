import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { verifyPhoneOtpToken } from "@/lib/phone-otp-token";

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  session: {
    strategy: "jwt",
  },

  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),

    Credentials({
      name: "credentials",

      credentials: {
        email: {},
        password: {},
        phoneOtpToken: {},
      },

      async authorize(credentials) {
        if (!credentials?.email) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        });

        if (!user) {
          return null;
        }

        if (credentials.phoneOtpToken) {
          // Phone OTP login: requires a short-lived token issued by the
          // verify-otp endpoint AFTER the OTP was validated server-side.
          const tokenPayload = verifyPhoneOtpToken(
            credentials.phoneOtpToken as string
          );

        if (!tokenPayload || tokenPayload.email !== user.email) {
          return null;
        }

        // Partners must use their own portal, not customer login.
        if (user.role === "PARTNER") {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }

      if (!credentials?.password) {
        return null;
      }

      if (!user.password) {
        return null;
      }

      const isValid = await bcrypt.compare(
        credentials.password as string,
        user.password
      );

      if (!isValid) {
        return null;
      }

      // Partners must use their own portal, not customer login.
      if (user.role === "PARTNER") {
        return null;
      }

      if (user.role === "CUSTOMER" && !user.emailVerified) {
        return null;
      }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email;
        if (!email) return false;

        let existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (!existingUser) {
          existingUser = await prisma.user.create({
            data: {
              email,
              name: user.name || "",
              role: "CUSTOMER",
              isActive: true,
              isVerified: true,
              emailVerified: true,
            },
          });
        } else {
          if (!existingUser.isActive) {
            return false;
          }

          // Partners must use their own portal, not customer login.
          if (existingUser.role === "PARTNER") {
            return false;
          }

          if (!existingUser.emailVerified) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { emailVerified: true, isVerified: true },
            });
          }
        }

        user.id = existingUser.id;
        (user as { role: string }).role = existingUser.role;
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: string }).role;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }

      return session;
    },
  },
});
