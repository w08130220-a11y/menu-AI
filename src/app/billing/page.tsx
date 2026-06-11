import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles, Check, ArrowLeft, BadgeCheck, AlertTriangle } from "lucide-react";
import { getSession } from "@/lib/session";
import { getSubscription, PLANS, isLocked } from "@/lib/billing";
import { fmtMoney } from "@/lib/constants";
import { SubscribeButton, CancelButton } from "./billing-client";

export const metadata = { title: "訂閱方案" };
export const dynamic = "force-dynamic";

const FEATURES = [
  "線上預約 + 簡訊通知",
  "POS 收款與儲值金",
  "排班、打卡與薪資計算",
  "顧客 CRM、療程券、施作照片",
  "多分店與跨店報表",
  "員工頁籤權限管理",
];

export default async function BillingPage() {
  const me = await getSession();
  if (!me) redirect("/login");

  const sub = await getSubscription();
  const isAdmin = me.role === "ADMIN";
  const stripeConfigured = !!process.env.STRIPE_SECRET_KEY;
  const locked = isLocked(sub);

  const statusBadge = {
    TRIALING: { text: `免費試用中・剩 ${sub.daysLeft} 天`, cls: "bg-sky-100 text-sky-700" },
    ACTIVE: {
      text: `訂閱有效・${sub.currentPeriodEnd?.toLocaleDateString("zh-TW")} 到期${sub.status === "CANCELED" ? "（已排定取消）" : ""}`,
      cls: "bg-emerald-100 text-emerald-700",
    },
    PAST_DUE: { text: "扣款失敗，請更新付款方式", cls: "bg-amber-100 text-amber-700" },
    EXPIRED: { text: "訂閱已到期，功能已鎖定", cls: "bg-red-100 text-red-700" },
    INACTIVE: { text: "尚未訂閱", cls: "bg-muted text-muted-foreground" },
  }[sub.effective];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-background">
      <header className="border-b bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-6 w-6" />
            <span className="text-xl font-bold">BeauHub</span>
          </div>
          {!locked && (
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> 回管理後台
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-center text-2xl font-bold mb-2">訂閱方案</h1>
        <div className="flex justify-center mb-8">
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusBadge.cls}`}>
            {statusBadge.text}
          </span>
        </div>

        {locked && (
          <div className="mb-8 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            {isAdmin
              ? "訂閱已到期，後台功能已鎖定。完成訂閱後立即恢復，所有資料皆完整保留。"
              : "系統訂閱已到期，請通知管理者完成續訂後即可繼續使用。"}
          </div>
        )}

        {isAdmin ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              {/* 月繳 */}
              <div className="rounded-2xl border bg-card p-6 flex flex-col">
                <h2 className="font-bold">{PLANS.MONTHLY.label}</h2>
                <p className="mt-3">
                  <span className="text-3xl font-bold">{fmtMoney(PLANS.MONTHLY.price)}</span>
                  <span className="text-muted-foreground text-sm"> / 月</span>
                </p>
                <p className="mt-1 text-sm text-sky-600 font-medium">
                  {!sub.trialUsed ? "首次訂閱免費試用 7 天" : "　"}
                </p>
                <ul className="mt-4 mb-6 space-y-2 text-sm flex-1">
                  {FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <SubscribeButton
                  plan="MONTHLY"
                  label={!sub.trialUsed ? "開始 7 天免費試用" : "訂閱月繳方案"}
                />
              </div>

              {/* 年繳 */}
              <div className="relative rounded-2xl border-2 border-primary bg-card p-6 flex flex-col">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-white">
                  最划算・8 折
                </span>
                <h2 className="font-bold">{PLANS.YEARLY.label}</h2>
                <p className="mt-3">
                  <span className="text-3xl font-bold">{fmtMoney(PLANS.YEARLY.price)}</span>
                  <span className="text-muted-foreground text-sm"> / 年</span>
                </p>
                <p className="mt-1 text-sm text-primary font-medium">{PLANS.YEARLY.note}</p>
                <ul className="mt-4 mb-6 space-y-2 text-sm flex-1">
                  {FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" /> {f}
                    </li>
                  ))}
                  <li className="flex items-center gap-2 font-medium">
                    <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
                    一次付清，整年不漲價
                  </li>
                </ul>
                <SubscribeButton plan="YEARLY" label="訂閱年繳方案" highlight />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {stripeConfigured
                  ? "付款由 Stripe 安全處理，卡號不經過本系統。"
                  : "目前為示範模式：點擊訂閱會直接開通。設定 STRIPE_SECRET_KEY 與價格 ID 後即切換為 Stripe 付款。"}
              </p>
              {(sub.effective === "ACTIVE" || sub.effective === "TRIALING") &&
                sub.status !== "CANCELED" && <CancelButton />}
            </div>
          </>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            訂閱方案由主帳號（管理者）管理。
          </p>
        )}
      </main>
    </div>
  );
}
