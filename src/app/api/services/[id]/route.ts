import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isManager } from "@/lib/session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getSession();
  if (!me || !isManager(me)) return NextResponse.json({ error: "需要管理者權限" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const updated = await prisma.service.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.price !== undefined && { price: Number(body.price) }),
      ...(body.durationMin !== undefined && { durationMin: Number(body.durationMin) }),
      ...(body.description !== undefined && { description: body.description || null }),
      ...(body.active !== undefined && { active: !!body.active }),
    },
  });
  return NextResponse.json(updated);
}
