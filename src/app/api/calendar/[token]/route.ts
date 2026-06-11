import { prisma } from "@/lib/prisma";
import { APPOINTMENT_STATUS } from "@/lib/constants";

// 個人預約行事曆訂閱（iCalendar feed）。
// Apple 行事曆 / Google 日曆以 webcal:// 或 https:// 訂閱此網址後，
// 預約會自動同步到手機行事曆並依使用者設定發出提醒。
// 以隨機金鑰識別員工（行事曆 App 無法帶登入 cookie）。

const escapeIcs = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

const toUtc = (d: Date) =>
  d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!/^[a-f0-9]{48}$/.test(token)) {
    return new Response("Not found", { status: 404 });
  }
  const staff = await prisma.staff.findUnique({ where: { calendarToken: token } });
  if (!staff || !staff.active) {
    return new Response("Not found", { status: 404 });
  }

  // 過去 30 天 ～ 未來所有未取消的預約
  const since = new Date(Date.now() - 30 * 86400000);
  const appointments = await prisma.appointment.findMany({
    where: {
      staffId: staff.id,
      status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
      startAt: { gte: since },
    },
    include: {
      customer: { select: { name: true, phone: true } },
      service: { select: { name: true, durationMin: true } },
    },
    orderBy: { startAt: "asc" },
  });

  const now = toUtc(new Date());
  const events = appointments.map((a) => {
    const summary = `${a.service.name}・${a.customer.name}${a.status === "PENDING" ? "（待確認）" : ""}`;
    const desc = [
      `顧客：${a.customer.name}（${a.customer.phone}）`,
      `狀態：${APPOINTMENT_STATUS[a.status] ?? a.status}`,
      a.note ? `備註：${a.note}` : null,
    ]
      .filter(Boolean)
      .join("\n");
    return [
      "BEGIN:VEVENT",
      `UID:appt-${a.id}@beautytime`,
      `DTSTAMP:${now}`,
      `DTSTART:${toUtc(a.startAt)}`,
      `DTEND:${toUtc(a.endAt)}`,
      `SUMMARY:${escapeIcs(summary)}`,
      `DESCRIPTION:${escapeIcs(desc)}`,
      `STATUS:${a.status === "PENDING" ? "TENTATIVE" : "CONFIRMED"}`,
      // 開始前 1 小時提醒（行事曆 App 可自行調整）
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "DESCRIPTION:預約提醒",
      "TRIGGER:-PT1H",
      "END:VALARM",
      "END:VEVENT",
    ].join("\r\n");
  });

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BeautyTime//Appointments//TW",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcs(`BeautyTime 預約（${staff.name}）`)}`,
    "X-WR-TIMEZONE:Asia/Taipei",
    "REFRESH-INTERVAL;VALUE=DURATION:PT30M",
    "X-PUBLISHED-TTL:PT30M",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="beautytime-${staff.id}.ics"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
