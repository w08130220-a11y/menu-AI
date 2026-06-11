import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { APPOINTMENT_STATUS } from "@/lib/constants";
import { sendSms, bookingConfirmedMessage } from "@/lib/notify";

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
  const before = await prisma.appointment.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "找不到預約" }, { status: 404 });

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status },
    include: {
      customer: true,
      service: true,
      staff: { include: { store: true } },
    },
  });

  // 由「待確認」變更為「已確認」→ 發送確認通知
  if (before.status === "PENDING" && status === "CONFIRMED") {
    await sendSms({
      to: updated.customer.phone,
      kind: "BOOKING_CONFIRMED",
      appointmentId: updated.id,
      message: bookingConfirmedMessage({
        storeName: updated.staff.store.name,
        customerName: updated.customer.name,
        serviceName: updated.service.name,
        date: updated.date,
        startAt: updated.startAt,
      }),
    });
  }

  return NextResponse.json({ id: updated.id, status: updated.status });
}
