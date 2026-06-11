import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// 後台新增預約
export async function POST(request: Request) {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { customerId, staffId, serviceId, date, time, note, source } = await request.json();
  if (!customerId || !staffId || !serviceId || !date || !time) {
    return NextResponse.json({ error: "參數不足" }, { status: 400 });
  }
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) return NextResponse.json({ error: "找不到服務項目" }, { status: 404 });

  const startAt = new Date(`${date}T${time}:00`);
  const endAt = new Date(startAt.getTime() + service.durationMin * 60000);

  // 同設計師時段衝突檢查
  const conflict = await prisma.appointment.findFirst({
    where: {
      staffId,
      date,
      status: { in: ["PENDING", "CONFIRMED"] },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
  });
  if (conflict) {
    return NextResponse.json({ error: "該時段此服務人員已有預約" }, { status: 409 });
  }

  const appointment = await prisma.appointment.create({
    data: {
      customerId,
      staffId,
      serviceId,
      date,
      startAt,
      endAt,
      status: "CONFIRMED",
      source: source ?? "PHONE",
      note: note || null,
    },
  });
  return NextResponse.json(appointment);
}
