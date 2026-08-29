import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { withMobileAuth } from "@/lib/mobile-auth";

export const GET = withMobileAuth(async (_req: NextRequest, _ctx, userId: string) => {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  return NextResponse.json({ id: user.id, email: user.email, name: user.name });
});
