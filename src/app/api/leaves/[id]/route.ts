import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isManager } from "@/lib/session";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getSession();
  if (!me || !isManager(me)) {
    return NextResponse.json({ error: "需要管理者權限" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.leave.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
