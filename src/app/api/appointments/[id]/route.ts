import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { APPOINTMENT_STATUS } from "@/lib/constants";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { id } = await params;
  const { status } = await request.json();
  if (!APPOINTMENT_STATUS[status]) {
    return NextResponse.json({ error: "狀態錯誤" }, { status: 400 });
  }
  const updated = await prisma.appointment.update({
    where: { id },
    data: { status },
  });
  return NextResponse.json(updated);
}
