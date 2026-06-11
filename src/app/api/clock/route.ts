import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const ymd = (d: Date) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};

// 打卡：尚無未下班紀錄 → 上班卡；有 → 補下班卡
export async function POST() {
  const staff = await getSession();
  if (!staff) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const now = new Date();
  const open = await prisma.timeRecord.findFirst({
    where: { staffId: staff.id, clockOut: null },
    orderBy: { clockIn: "desc" },
  });

  if (open) {
    await prisma.timeRecord.update({
      where: { id: open.id },
      data: { clockOut: now },
    });
    return NextResponse.json({ ok: true, action: "OUT" });
  }

  await prisma.timeRecord.create({
    data: { staffId: staff.id, workDate: ymd(now), clockIn: now },
  });
  return NextResponse.json({ ok: true, action: "IN" });
}
