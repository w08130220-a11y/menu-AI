import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isManager } from "@/lib/session";

// 刪除儲值金異動紀錄並沖銷餘額（店長以上；消費折抵紀錄不可刪，需以結帳處理）
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getSession();
  if (!me || !isManager(me)) {
    return NextResponse.json({ error: "需要管理者權限" }, { status: 403 });
  }
  const { id } = await params;
  const tx = await prisma.balanceTransaction.findUnique({
    where: { id },
    include: { customer: true },
  });
  if (!tx) return NextResponse.json({ error: "找不到紀錄" }, { status: 404 });
  if (tx.kind === "SPEND") {
    return NextResponse.json({ error: "消費折抵紀錄不可刪除" }, { status: 400 });
  }
  if (tx.customer.balance - tx.amount < 0) {
    return NextResponse.json(
      { error: "刪除後餘額將為負數（儲值金可能已被使用），無法刪除" },
      { status: 400 }
    );
  }
  await prisma.$transaction([
    prisma.customer.update({
      where: { id: tx.customerId },
      data: { balance: { decrement: tx.amount } },
    }),
    prisma.balanceTransaction.delete({ where: { id } }),
  ]);
  return NextResponse.json({ ok: true });
}
