import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// 為顧客開立療程券（從方案下拉選擇）
export async function POST(request: Request) {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { customerId, templateId } = await request.json();
  if (!customerId || !templateId) {
    return NextResponse.json({ error: "請選擇療程券方案" }, { status: 400 });
  }
  const template = await prisma.passTemplate.findUnique({ where: { id: templateId } });
  if (!template || !template.active) {
    return NextResponse.json({ error: "方案不存在或已停用" }, { status: 404 });
  }
  const pass = await prisma.customerPass.create({
    data: {
      customerId,
      name: template.name,
      totalSessions: template.totalSessions,
      expiresAt: new Date(Date.now() + template.validDays * 86400000),
    },
  });
  return NextResponse.json(pass);
}
