import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession, isManager } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { RemindButton } from "./remind-button";

const KIND_LABEL: Record<string, string> = {
  BOOKING_RECEIVED: "預約受理",
  BOOKING_CONFIRMED: "預約確認",
  REMINDER: "前日提醒",
  DEPOSIT_PAID: "訂金入帳",
};

const STATUS_STYLE: Record<string, string> = {
  SENT: "bg-emerald-100 text-emerald-700",
  SIMULATED: "bg-sky-100 text-sky-700",
  FAILED: "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  SENT: "已發送",
  SIMULATED: "模擬發送",
  FAILED: "發送失敗",
};

export default async function NotificationsPage() {
  const me = await getSession();
  if (!me) redirect("/login");
  if (!isManager(me)) redirect("/dashboard");

  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const smsConfigured = !!(process.env.SMS_API_URL && process.env.SMS_API_KEY);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">通知紀錄</h1>
          <p className="text-muted-foreground text-sm">
            預約受理 / 確認 / 提醒 / 訂金通知的發送紀錄
          </p>
        </div>
        <RemindButton />
      </div>

      {!smsConfigured && (
        <Card className="border-sky-200 bg-sky-50/60">
          <CardContent className="py-3 text-sm">
            目前為<span className="font-medium">模擬發送模式</span>：通知內容會完整記錄在下方但不會實際發出。
            在 <code className="rounded bg-muted px-1">.env</code> 設定{" "}
            <code className="rounded bg-muted px-1">SMS_API_URL</code> 與{" "}
            <code className="rounded bg-muted px-1">SMS_API_KEY</code>{" "}
            即可切換為實際發送（支援三竹、every8d、Twilio 等任何 HTTP 簡訊閘道）。
            另可設定 <code className="rounded bg-muted px-1">CRON_SECRET</code> 搭配排程器每日自動發送提醒。
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-5">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">尚無通知紀錄</p>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => (
                <div key={n.id} className="py-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{n.channel}</span>
                    <span className="font-medium">{KIND_LABEL[n.kind] ?? n.kind}</span>
                    <span className="text-muted-foreground font-mono text-xs">{n.recipient}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[n.status]}`}>
                      {STATUS_LABEL[n.status] ?? n.status}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {n.createdAt.toLocaleString("zh-TW", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
