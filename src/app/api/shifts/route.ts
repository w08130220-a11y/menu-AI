import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isManager } from "@/lib/session";
import { SHIFT_TYPES } from "@/lib/constants";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function POST(request: Request) {
  const me = await getSession();
  if (!me || !isManager(me)) {
    return NextResponse.json({ error: "需要管理者權限" }, { status: 403 });
  }
  const { staffId, workDate, shiftType, startTime, endTime } = await request.json();
  if (!staffId || !workDate || !SHIFT_TYPES[shiftType]) {
    return NextResponse.json({ error: "參數錯誤" }, { status: 400 });
  }

  let start = "";
  let end = "";
  if (shiftType === "CUSTOM") {
    if (!TIME_RE.test(startTime ?? "") || !TIME_RE.test(endTime ?? "") || startTime >= endTime) {
      return NextResponse.json({ error: "自訂班別請輸入正確的開始/結束時間" }, { status: 400 });
    }
    start = startTime;
    end = endTime;
  } else if (shiftType !== "OFF") {
    const def = SHIFT_TYPES[shiftType];
    start = def.start;
    end = def.end;
  }

  await prisma.shift.upsert({
    where: { staffId_workDate: { staffId, workDate } },
    update: { shiftType, startTime: start, endTime: end },
    create: { staffId, workDate, shiftType, startTime: start, endTime: end },
  });
  return NextResponse.json({ ok: true });
}
