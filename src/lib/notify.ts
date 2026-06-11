import { prisma } from "@/lib/prisma";
import { linePush } from "@/lib/line";

// LINE 通知發送：
// - 分店已設定 LINE 官方帳號金鑰且顧客已綁定 → 透過商家 OA 實際推播
// - 顧客未綁定 LINE → 記錄 NOT_BOUND（顧客加官方帳號好友並傳手機號碼即完成綁定）
// - 分店未設定金鑰 → 記錄 SIMULATED（介面照常顯示內容，填入金鑰即切換為實送）
export type NotifyKind = "BOOKING_RECEIVED" | "BOOKING_CONFIRMED" | "REMINDER" | "DEPOSIT_PAID";

export async function sendLine(opts: {
  customer: { id: string; phone: string; lineUserId: string | null };
  store: { lineChannelAccessToken: string | null };
  message: string;
  kind: NotifyKind;
  appointmentId?: string;
}) {
  let status = "SIMULATED";
  const token = opts.store.lineChannelAccessToken;
  if (token) {
    if (!opts.customer.lineUserId) {
      status = "NOT_BOUND";
    } else {
      try {
        status = (await linePush(token, opts.customer.lineUserId, opts.message))
          ? "SENT"
          : "FAILED";
      } catch {
        status = "FAILED";
      }
    }
  }
  await prisma.notification.create({
    data: {
      channel: "LINE",
      recipient: opts.customer.phone,
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
