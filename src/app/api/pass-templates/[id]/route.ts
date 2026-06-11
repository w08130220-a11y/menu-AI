import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isManager } from "@/lib/session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getSession();
  if (!me || !isManager(me)) {
    return NextResponse.json({ error: "需要管理者權限" }, { status: 403 });
  }
  const { id } = await params;
  const body = await request.json();
  const updated = await prisma.passTemplate.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: String(body.name).slice(0, 50) }),
      ...(body.totalSessions !== undefined && { totalSessions: Math.max(1, Number(body.totalSessions)) }),
      ...(body.validDays !== undefined && { validDays: Math.max(1, Number(body.validDays) || 180) }),
      ...(body.price !== undefined && { price: Math.max(0, Number(body.price) || 0) }),
      ...(body.active !== undefined && { active: !!body.active }),
    },
  });
  return NextResponse.json(updated);
}
