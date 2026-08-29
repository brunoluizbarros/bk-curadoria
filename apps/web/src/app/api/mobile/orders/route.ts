import { NextRequest, NextResponse } from "next/server";
import { getAllOrders, type OrderStatus } from "@/server/queries/orders";
import { withMobileAuth } from "@/lib/mobile-auth";

const LIMIT = 20;

export const GET = withMobileAuth(async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

  // default = mês atual; ym="" = todos (mesma convenção de /admin/pedidos)
  const ym = searchParams.get("ym") ?? new Date().toISOString().slice(0, 7);
  let from: Date | undefined;
  let to: Date | undefined;
  if (ym !== "") {
    const [year, month] = ym.split("-").map(Number);
    from = new Date(year, month - 1, 1);
    to = new Date(year, month, 1);
  }

  const { items, total } = await getAllOrders(
    { status: status as OrderStatus | undefined, search: q, from, to },
    { page, limit: LIMIT }
  );

  return NextResponse.json({ items, total, page, limit: LIMIT });
});
