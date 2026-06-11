import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// 新增療程券
export async function POST(request: Request) {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { customerId, name, totalSessions, expiresDays } = await request.json();
  if (!customerId || !name || !totalSessions) {
    return NextResponse.json({ error: "參數不足" }, { status: 400 });
  }
  const pass = await prisma.customerPass.create({
    data: {
      customerId,
      name,
      totalSessions: Number(totalSessions),
      expiresAt: expiresDays
        ? new Date(Date.now() + Number(expiresDays) * 86400000)
        : null,
    },
  });
  return NextResponse.json(pass);
}
