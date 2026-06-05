import type { NextAuthConfig, DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
  }
}

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnProtectedArea = nextUrl.pathname.startsWith("/dashboard") ||
                                nextUrl.pathname.startsWith("/recepcion") ||
                                nextUrl.pathname.startsWith("/clientes") ||
                                nextUrl.pathname.startsWith("/ordenes") ||
                                nextUrl.pathname.startsWith("/configuracion");
                            
      if (isOnProtectedArea) {
        if (isLoggedIn) return true;
        return false; // Redirige a /login
      } else if (isLoggedIn && nextUrl.pathname === "/login") {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  providers: [], // Vacío aquí para que sea compatible con Edge
} satisfies NextAuthConfig;
