import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isManager } from "@/lib/session";
import { LEAVE_TYPES } from "@/lib/constants";

// 請假登記（店長以上）
export async function POST(request: Request) {
  const me = await getSession();
  if (!me || !isManager(me)) {
    return NextResponse.json({ error: "需要管理者權限" }, { status: 403 });
  }
  const { staffId, workDate, leaveType, days, note } = await request.json();
  if (!staffId || !/^\d{4}-\d{2}-\d{2}$/.test(workDate ?? "") || !LEAVE_TYPES[leaveType]) {
    return NextResponse.json({ error: "參數錯誤" }, { status: 400 });
  }
  const d = days === 0.5 ? 0.5 : 1;
  const leave = await prisma.leave.upsert({
    where: { staffId_workDate: { staffId, workDate } },
    update: { leaveType, days: d, note: note || null },
    create: { staffId, workDate, leaveType, days: d, note: note || null },
  });
  return NextResponse.json(leave);
}
