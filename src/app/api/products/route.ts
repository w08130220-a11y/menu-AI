import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isManager } from "@/lib/session";

export async function POST(request: Request) {
  const me = await getSession();
  if (!me || !isManager(me)) return NextResponse.json({ error: "需要管理者權限" }, { status: 403 });

  const { name, category, price, cost, stock, lowStockAt } = await request.json();
  if (!name || !price) return NextResponse.json({ error: "參數不足" }, { status: 400 });

  const product = await prisma.product.create({
    data: {
      name,
      category: category || null,
      price: Number(price),
      cost: Number(cost) || 0,
      stock: Number(stock) || 0,
      lowStockAt: Number(lowStockAt) || 5,
    },
  });
  return NextResponse.json(product);
}
