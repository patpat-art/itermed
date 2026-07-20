import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { config } from "@/lib/config";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  secret: config.AUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email).toLowerCase().trim();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;
        const valid = await compare(String(credentials.password), user.passwordHash);
        if (!valid) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      if (!token.id && token.sub) {
        token.id = token.sub;
      }

      // Re-read role from DB so promotions (e.g. STUDENT → ADMIN) apply without re-login.
      const userId = typeof token.id === "string" ? token.id : null;
      if (userId) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
          });
          if (dbUser?.role) {
            token.role = dbUser.role;
          }
        } catch {
          // Keep token.role if DB is temporarily unavailable.
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id ?? token.sub) as string;
        session.user.role = (token.role as string) ?? "STUDENT";
      }
      return session;
    },
  },
};
