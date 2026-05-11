import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import authConfig from "./auth.config";

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, String(credentials.email)));

        if (!user) return null;

        const valid = await bcrypt.compare(
          String(credentials.password),
          user.passwordHash
        );
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name ?? null };
      },
    }),
  ],
});
