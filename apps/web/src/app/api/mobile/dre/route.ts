import { NextRequest, NextResponse } from "next/server";
import { getDREByMonth } from "@/server/queries/dre";
import { withMobileAuth } from "@/lib/mobile-auth";

export const GET = withMobileAuth(async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const now = new Date();
  const ano = parseInt(searchParams.get("ano") ?? String(now.getFullYear()), 10);
  const mes = parseInt(searchParams.get("mes") ?? String(now.getMonth() + 1), 10);

  const dre = await getDREByMonth(ano, mes);
  return NextResponse.json(dre);
});
