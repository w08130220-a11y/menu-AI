import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isManager } from "@/lib/session";
import { sendSms, reminderMessage } from "@/lib/notify";

const ymd = (d: Date) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};

// 發送「明日預約提醒」。兩種呼叫方式：
// 1. 後台按鈕（店長以上）
// 2. 外部排程器（cron）帶 x-cron-secret header，可每天定時自動發送
export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const fromCron =
    cronSecret && request.headers.get("x-cron-secret") === cronSecret;

  if (!fromCron) {
    const me = await getSession();
    if (!me || !isManager(me)) {
      return NextResponse.json({ error: "需要管理者權限" }, { status: 403 });
    }
  }

  const tomorrow = ymd(new Date(Date.now() + 86400000));
  const appointments = await prisma.appointment.findMany({
    where: { date: tomorrow, status: "CONFIRMED" },
    include: {
      customer: true,
      service: true,
      staff: { include: { store: true } },
      notifications: { where: { kind: "REMINDER" }, select: { id: true } },
    },
  });

  let sent = 0;
  for (const a of appointments) {
    if (a.notifications.length > 0) continue; // 已提醒過，不重複發送
    await sendSms({
      to: a.customer.phone,
      kind: "REMINDER",
      appointmentId: a.id,
      message: reminderMessage({
        storeName: a.staff.store.name,
        customerName: a.customer.name,
        serviceName: a.service.name,
        date: a.date,
        startAt: a.startAt,
        staffName: a.staff.name,
      }),
    });
    sent += 1;
  }

  return NextResponse.json({ ok: true, date: tomorrow, total: appointments.length, sent });
}
