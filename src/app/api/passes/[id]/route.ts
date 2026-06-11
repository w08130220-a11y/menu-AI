import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// 核銷一堂
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { id } = await params;
  const pass = await prisma.customerPass.findUnique({ where: { id } });
  if (!pass) return NextResponse.json({ error: "找不到療程券" }, { status: 404 });
  if (pass.usedSessions >= pass.totalSessions) {
    return NextResponse.json({ error: "堂數已用完" }, { status: 400 });
  }
  if (pass.expiresAt && pass.expiresAt < new Date()) {
    return NextResponse.json({ error: "療程券已過期" }, { status: 400 });
  }
  const updated = await prisma.customerPass.update({
    where: { id },
    data: { usedSessions: { increment: 1 } },
  });
  return NextResponse.json(updated);
}
