import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession, isManager } from "@/lib/session";
import { getActiveStoreId } from "@/lib/store-context";
import { Card, CardContent } from "@/components/ui/card";
import { RemindButton } from "./remind-button";
import { LineSettingsDialog } from "./line-settings";

const KIND_LABEL: Record<string, string> = {
  BOOKING_RECEIVED: "預約受理",
  BOOKING_CONFIRMED: "預約確認",
  REMINDER: "前日提醒",
  DEPOSIT_PAID: "訂金入帳",
};

const STATUS_STYLE: Record<string, string> = {
  SENT: "bg-emerald-100 text-emerald-700",
  SIMULATED: "bg-sky-100 text-sky-700",
  NOT_BOUND: "bg-amber-100 text-amber-700",
  FAILED: "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  SENT: "已發送",
  SIMULATED: "模擬發送",
  NOT_BOUND: "顧客未綁定",
  FAILED: "發送失敗",
};

export default async function NotificationsPage() {
  const me = await getSession();
  if (!me) redirect("/login");
  if (!isManager(me)) redirect("/dashboard");

  const activeStoreId = await getActiveStoreId(me);
  const storeId = activeStoreId ?? me.storeId;

  const [notifications, store, boundCount, customerCount] = await Promise.all([
    prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.store.findUnique({ where: { id: storeId } }),
    prisma.customer.count({ where: { lineUserId: { not: null } } }),
    prisma.customer.count(),
  ]);

  const lineConfigured = !!store?.lineChannelAccessToken;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">LINE 通知</h1>
          <p className="text-muted-foreground text-sm">
            預約受理 / 確認 / 提醒 / 訂金通知・顧客綁定 {boundCount} / {customerCount} 位
          </p>
        </div>
        <div className="flex gap-2">
          <LineSettingsDialog
            storeName={store?.name ?? ""}
            webhookUrl={`${appUrl}/api/webhooks/line/${storeId}`}
            configured={lineConfigured}
            hasSecret={!!store?.lineChannelSecret}
          />
          <RemindButton />
        </div>
      </div>

      {!lineConfigured && (
        <Card className="border-sky-200 bg-sky-50/60">
          <CardContent className="py-3 text-sm leading-relaxed">
            目前為<span className="font-medium">模擬發送模式</span>：通知內容會完整記錄在下方但不會實際發出。
            點「LINE 串接設定」綁定商家自己的 <span className="font-medium">LINE 官方帳號</span>後，
            系統就會自動透過官方帳號推播給已綁定的顧客（顧客加好友＋傳手機號碼即完成綁定）。
            LINE 官方帳號每月 200 則推播免費。
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
                    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[n.status] ?? ""}`}>
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

      <p className="text-xs text-muted-foreground">
        ※「顧客未綁定」表示該顧客尚未加官方帳號好友完成綁定；可請顧客掃描店內的官方帳號 QR code 並傳送手機號碼。
      </p>
    </div>
  );
}
