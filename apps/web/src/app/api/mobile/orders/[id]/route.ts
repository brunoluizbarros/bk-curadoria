import { NextRequest, NextResponse } from "next/server";
import { getOrderById } from "@/server/queries/orders";
import { withMobileAuth } from "@/lib/mobile-auth";

export const GET = withMobileAuth(async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const order = await getOrderById(id);
  if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  return NextResponse.json(order);
});
