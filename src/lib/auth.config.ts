import type { NextAuthConfig } from "next-auth";

export default {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isAdminPath = request.nextUrl.pathname.startsWith("/admin");
      if (isAdminPath) return !!auth?.user;
      return true;
    },
  },
  providers: [],
  session: { strategy: "jwt" },
} satisfies NextAuthConfig;
