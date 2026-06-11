import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isManager } from "@/lib/session";

// 新增療程券方案（店長以上）
export async function POST(request: Request) {
  const me = await getSession();
  if (!me || !isManager(me)) {
    return NextResponse.json({ error: "需要管理者權限" }, { status: 403 });
  }
  const { name, totalSessions, validDays, price } = await request.json();
  if (!name || !Number(totalSessions)) {
    return NextResponse.json({ error: "請填寫方案名稱與堂數" }, { status: 400 });
  }
  const template = await prisma.passTemplate.create({
    data: {
      name: String(name).slice(0, 50),
      totalSessions: Math.max(1, Number(totalSessions)),
      validDays: Math.max(1, Number(validDays) || 180),
      price: Math.max(0, Number(price) || 0),
    },
  });
  return NextResponse.json(template);
}
