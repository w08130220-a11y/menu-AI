import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isManager } from "@/lib/session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getSession();
  if (!me || !isManager(me)) return NextResponse.json({ error: "需要管理者權限" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();

  // 進貨 / 盤點調整
  if (typeof body.stockDelta === "number") {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return NextResponse.json({ error: "找不到產品" }, { status: 404 });
    if (product.stock + body.stockDelta < 0) {
      return NextResponse.json({ error: "庫存不可為負" }, { status: 400 });
    }
    const updated = await prisma.product.update({
      where: { id },
      data: { stock: { increment: body.stockDelta } },
    });
    return NextResponse.json(updated);
  }

  const updated = await prisma.product.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.category !== undefined && { category: body.category || null }),
      ...(body.price !== undefined && { price: Number(body.price) }),
      ...(body.cost !== undefined && { cost: Number(body.cost) }),
      ...(body.lowStockAt !== undefined && { lowStockAt: Number(body.lowStockAt) }),
      ...(body.active !== undefined && { active: !!body.active }),
    },
  });
  return NextResponse.json(updated);
}
