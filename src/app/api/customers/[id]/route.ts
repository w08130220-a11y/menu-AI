import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  // 儲值（正數）或扣款（負數）
  if (typeof body.balanceDelta === "number") {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) return NextResponse.json({ error: "找不到顧客" }, { status: 404 });
    if (customer.balance + body.balanceDelta < 0) {
      return NextResponse.json({ error: "儲值金餘額不足" }, { status: 400 });
    }
    const updated = await prisma.customer.update({
      where: { id },
      data: { balance: { increment: body.balanceDelta } },
    });
    return NextResponse.json(updated);
  }

  const { name, phone, email, gender, birthday, note, tags } = body;
  const updated = await prisma.customer.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email: email || null }),
      ...(gender !== undefined && { gender: gender || null }),
      ...(birthday !== undefined && { birthday: birthday || null }),
      ...(note !== undefined && { note: note || null }),
      ...(tags !== undefined && { tags: tags || null }),
    },
  });
  return NextResponse.json(updated);
}
