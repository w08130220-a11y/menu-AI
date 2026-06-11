import { prisma } from "@/lib/prisma";

// 通知發送抽象層：
// - 設定 SMS_API_URL / SMS_API_KEY 即透過簡訊閘道（三竹、every8d、Twilio webhook 皆可）實送
// - 設定 LINE_CHANNEL_ACCESS_TOKEN 即透過 LINE Messaging API 實送（需顧客 LINE userId）
// - 未設定時以 SIMULATED 記錄到資料庫，介面照常顯示，正式環境填入金鑰即可切換
export type NotifyKind = "BOOKING_RECEIVED" | "BOOKING_CONFIRMED" | "REMINDER" | "DEPOSIT_PAID";

export async function sendSms(opts: {
  to: string;
  message: string;
  kind: NotifyKind;
  appointmentId?: string;
}) {
  let status = "SIMULATED";
  const url = process.env.SMS_API_URL;
  const key = process.env.SMS_API_KEY;
  if (url && key) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ to: opts.to, text: opts.message }),
      });
      status = res.ok ? "SENT" : "FAILED";
    } catch {
      status = "FAILED";
    }
  }
  await prisma.notification.create({
    data: {
      channel: "SMS",
      recipient: opts.to,
      message: opts.message,
      status,
      kind: opts.kind,
      appointmentId: opts.appointmentId ?? null,
    },
  });
  return status;
}

const fmtTime = (d: Date) =>
  d.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false });

export function bookingReceivedMessage(p: {
  storeName: string;
  customerName: string;
  serviceName: string;
  date: string;
  startAt: Date;
  deposit?: number;
}) {
  const dep = p.deposit
    ? `，請於 30 分鐘內完成訂金 NT$${p.deposit.toLocaleString()} 付款以保留時段`
    : "，門市確認後將再通知您";
  return `【${p.storeName}】${p.customerName} 您好，已收到您的預約申請：${p.date} ${fmtTime(p.startAt)} ${p.serviceName}${dep}。`;
}

export function bookingConfirmedMessage(p: {
  storeName: string;
  customerName: string;
  serviceName: string;
  date: string;
  startAt: Date;
}) {
  return `【${p.storeName}】${p.customerName} 您好，您的預約已確認：${p.date} ${fmtTime(p.startAt)} ${p.serviceName}。期待您的光臨！`;
}

export function reminderMessage(p: {
  storeName: string;
  customerName: string;
  serviceName: string;
  date: string;
  startAt: Date;
  staffName: string;
}) {
  return `【${p.storeName}】提醒您，${p.customerName} 明天 ${fmtTime(p.startAt)} 有 ${p.serviceName} 預約（服務人員：${p.staffName}）。如需改期請來電。`;
}

export function depositPaidMessage(p: {
  storeName: string;
  customerName: string;
  amount: number;
  date: string;
  startAt: Date;
}) {
  return `【${p.storeName}】${p.customerName} 您好，已收到訂金 NT$${p.amount.toLocaleString()}，您的 ${p.date} ${fmtTime(p.startAt)} 預約已成立。`;
}
