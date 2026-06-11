import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isManager } from "@/lib/session";
import { SHIFT_TYPES } from "@/lib/constants";

export async function POST(request: Request) {
  const me = await getSession();
  if (!me || !isManager(me)) {
    return NextResponse.json({ error: "需要管理者權限" }, { status: 403 });
  }
  const { staffId, workDate, shiftType } = await request.json();
  if (!staffId || !workDate || !SHIFT_TYPES[shiftType]) {
    return NextResponse.json({ error: "參數錯誤" }, { status: 400 });
  }
  const def = SHIFT_TYPES[shiftType];
  await prisma.shift.upsert({
    where: { staffId_workDate: { staffId, workDate } },
    update: { shiftType, startTime: def.start, endTime: def.end },
    create: { staffId, workDate, shiftType, startTime: def.start, endTime: def.end },
  });
  return NextResponse.json({ ok: true });
}
