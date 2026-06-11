import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { sendSms, bookingReceivedMessage } from "@/lib/notify";

const bookingSchema = z.object({
  serviceId: z.string().min(1).max(64),
  staffId: z.string().min(1).max(64),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  name: z.string().trim().min(1).max(30),
  phone: z
    .string()
    .trim()
    .regex(/^[\d\-+() ]{8,20}$/, "手機號碼格式不正確"),
  note: z.string().max(200).optional().nullable(),
});

// 顧客線上預約（公開，免登入）
export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!rateLimit(`booking:${ip}`, 10, 60_000).ok) {
    return NextResponse.json({ error: "操作過於頻繁，請稍後再試" }, { status: 429 });
  }

  const parsed = bookingSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "請完整填寫預約資訊" },
      { status: 400 }
    );
  }
  const { serviceId, staffId, date, time, name, phone, note } = parsed.data;

  const [service, staffMember] = await Promise.all([
    prisma.service.findUnique({ where: { id: serviceId } }),
    prisma.staff.findUnique({ where: { id: staffId }, include: { store: true } }),
  ]);
  if (!service || !service.active) {
    return NextResponse.json({ error: "服務項目不存在" }, { status: 404 });
  }
  if (!staffMember || !staffMember.active) {
    return NextResponse.json({ error: "服務人員不存在" }, { status: 404 });
  }

  const startAt = new Date(`${date}T${time}:00`);
  const endAt = new Date(startAt.getTime() + service.durationMin * 60000);
  if (Number.isNaN(startAt.getTime()) || startAt < new Date()) {
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
      depositAmount: service.depositAmount,
      depositStatus: service.depositAmount > 0 ? "UNPAID" : "NONE",
    },
    include: { staff: true, service: true },
  });

  // 預約受理通知（簡訊；未設定金鑰時記錄為模擬發送）
  await sendSms({
    to: phone,
    kind: "BOOKING_RECEIVED",
    appointmentId: appointment.id,
    message: bookingReceivedMessage({
      storeName: staffMember.store.name,
      customerName: customer.name,
      serviceName: service.name,
      date,
      startAt,
      deposit: service.depositAmount || undefined,
    }),
  });

  return NextResponse.json({
    id: appointment.id,
    date,
    time,
    serviceName: appointment.service.name,
    staffName: appointment.staff.name,
    depositAmount: service.depositAmount,
  });
}
