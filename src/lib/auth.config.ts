import type { NextAuthConfig } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    username?: string;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      role: string;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    username: string;
    role: string;
  }
}

const publicPaths = ["/login", "/api/auth", "/api/health"];
const adminPaths = ["/admin"];

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" as const },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.username = user.username!;
        token.role = user.role!;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.username = token.username;
      session.user.role = token.role;
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const { pathname } = nextUrl;

      if (publicPaths.some((p) => pathname.startsWith(p))) {
        return true;
      }

      if (!auth) {
        return false;
      }

      if (
        adminPaths.some((p) => pathname.startsWith(p)) &&
        auth.user.role !== "admin"
      ) {
        return Response.redirect(new URL("/", nextUrl));
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
