import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 顧客線上預約（公開，免登入）
export async function POST(request: Request) {
  const { serviceId, staffId, date, time, name, phone, note } = await request.json();
  if (!serviceId || !staffId || !date || !time || !name || !phone) {
    return NextResponse.json({ error: "請完整填寫預約資訊" }, { status: 400 });
  }

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || !service.active) {
    return NextResponse.json({ error: "服務項目不存在" }, { status: 404 });
  }

  const startAt = new Date(`${date}T${time}:00`);
  const endAt = new Date(startAt.getTime() + service.durationMin * 60000);
  if (startAt < new Date()) {
    return NextResponse.json({ error: "無法預約過去的時間" }, { status: 400 });
  }

  const shift = await prisma.shift.findUnique({
    where: { staffId_workDate: { staffId, workDate: date } },
  });
  if (shift?.shiftType === "OFF") {
    return NextResponse.json({ error: "該服務人員當日休假" }, { status: 409 });
  }

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
    return NextResponse.json({ error: "該時段剛被預約，請選擇其他時段" }, { status: 409 });
  }

  // 以手機號碼自動建檔 / 比對既有顧客
  const customer = await prisma.customer.upsert({
    where: { phone },
    update: {},
    create: { name, phone, tags: "新客" },
  });

  const appointment = await prisma.appointment.create({
    data: {
      customerId: customer.id,
      staffId,
      serviceId,
      date,
      startAt,
      endAt,
      status: "PENDING",
      source: "ONLINE",
      note: note || null,
    },
    include: { staff: true, service: true },
  });

  return NextResponse.json({
    id: appointment.id,
    date,
    time,
    serviceName: appointment.service.name,
    staffName: appointment.staff.name,
  });
}
