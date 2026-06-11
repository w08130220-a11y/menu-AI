import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { PAYMENT_METHODS } from "@/lib/constants";

type CartItem = {
  itemType: "SERVICE" | "PRODUCT";
  refId: string;
  qty: number;
  staffId: string;
};

export async function POST(request: Request) {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const body = await request.json();
  const items: CartItem[] = body.items ?? [];
  const { customerId, discount = 0, paymentMethod } = body;

  if (items.length === 0) return NextResponse.json({ error: "購物車是空的" }, { status: 400 });
  if (!PAYMENT_METHODS[paymentMethod]) {
    return NextResponse.json({ error: "付款方式錯誤" }, { status: 400 });
  }
  if (paymentMethod === "BALANCE" && !customerId) {
    return NextResponse.json({ error: "使用儲值金須選擇顧客" }, { status: 400 });
  }

  // 以資料庫價格為準計算
  const serviceIds = items.filter((i) => i.itemType === "SERVICE").map((i) => i.refId);
  const productIds = items.filter((i) => i.itemType === "PRODUCT").map((i) => i.refId);
  const [services, products] = await Promise.all([
    prisma.service.findMany({ where: { id: { in: serviceIds } } }),
    prisma.product.findMany({ where: { id: { in: productIds } } }),
  ]);

  const lines = items.map((i) => {
    const ref =
      i.itemType === "SERVICE"
        ? services.find((s) => s.id === i.refId)
        : products.find((p) => p.id === i.refId);
    if (!ref) throw new Error("ITEM_NOT_FOUND");
    const qty = Math.max(1, Math.floor(i.qty));
    return {
      staffId: i.staffId || me.id,
      itemType: i.itemType,
      serviceId: i.itemType === "SERVICE" ? i.refId : null,
      productId: i.itemType === "PRODUCT" ? i.refId : null,
      name: ref.name,
      unitPrice: ref.price,
      qty,
      subtotal: ref.price * qty,
    };
  });

  // 庫存檢查
  for (const p of products) {
    const need = lines
      .filter((l) => l.productId === p.id)
      .reduce((a, l) => a + l.qty, 0);
    if (need > p.stock) {
      return NextResponse.json({ error: `「${p.name}」庫存不足（剩 ${p.stock}）` }, { status: 400 });
    }
  }

  const subtotal = lines.reduce((a, l) => a + l.subtotal, 0);
  const disc = Math.min(Math.max(0, Math.floor(discount)), subtotal);
  const total = subtotal - disc;

  if (paymentMethod === "BALANCE") {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer || customer.balance < total) {
      return NextResponse.json({ error: "儲值金餘額不足" }, { status: 400 });
    }
  }

  const sale = await prisma.$transaction(async (tx) => {
    const created = await tx.sale.create({
      data: {
        customerId: customerId || null,
        cashierId: me.id,
        subtotal,
        discount: disc,
        total,
        paymentMethod,
        items: { create: lines },
      },
    });
    for (const l of lines) {
      if (l.productId) {
        await tx.product.update({
          where: { id: l.productId },
          data: { stock: { decrement: l.qty } },
        });
      }
    }
    if (paymentMethod === "BALANCE") {
      await tx.customer.update({
        where: { id: customerId },
        data: { balance: { decrement: total } },
      });
    }
    return created;
  });

  return NextResponse.json(sale);
}
