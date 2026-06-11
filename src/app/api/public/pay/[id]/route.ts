import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { sendLine, depositPaidMessage } from "@/lib/notify";

// 訂金付款（示範閘道）。
// 正式環境串接綠界 ECPay / 藍新 NewebPay / Stripe 時：
// 1. 這裡改為建立金流訂單並回傳付款頁網址
// 2. 新增金流 webhook route 驗證簽章後執行下方的入帳邏輯
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = clientIp(request);
  if (!rateLimit(`pay:${ip}`, 10, 60_000).ok) {
    return NextResponse.json({ error: "操作過於頻繁，請稍後再試" }, { status: 429 });
  }

  const { id } = await params;
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { customer: true, service: true, staff: { include: { store: true } } },
  });
  if (!appointment) return NextResponse.json({ error: "找不到預約" }, { status: 404 });
  if (appointment.depositStatus !== "UNPAID") {
    return NextResponse.json({ error: "此預約不需付款或已付款" }, { status: 400 });
  }
  if (appointment.status === "CANCELLED") {
    return NextResponse.json({ error: "預約已取消" }, { status: 400 });
  }

  // 訂金入帳 → 預約自動確認
  await prisma.appointment.update({
    where: { id },
    data: {
      depositStatus: "PAID",
      depositPaidAt: new Date(),
      status: appointment.status === "PENDING" ? "CONFIRMED" : appointment.status,
    },
  });

  await sendLine({
    customer: appointment.customer,
    store: appointment.staff.store,
    kind: "DEPOSIT_PAID",
    appointmentId: appointment.id,
    message: depositPaidMessage({
      storeName: appointment.staff.store.name,
      customerName: appointment.customer.name,
      amount: appointment.depositAmount,
      date: appointment.date,
      startAt: appointment.startAt,
    }),
  });

  return NextResponse.json({ ok: true });
}
