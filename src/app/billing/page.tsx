import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles, ArrowLeft, AlertTriangle } from "lucide-react";
import { getSession } from "@/lib/session";
import {
  getSubscription,
  getUsage,
  isLocked,
  isTierKey,
  TIERS,
  yearlyPrice,
} from "@/lib/billing";
import { PlanCards, CancelButton } from "./billing-client";

export const metadata = { title: "訂閱方案" };
export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const me = await getSession();
  if (!me) redirect("/login");

  const [sub, usage] = await Promise.all([getSubscription(), getUsage()]);
  const isAdmin = me.role === "ADMIN";
  const gatewayConfigured = !!(
    process.env.ECPAY_MERCHANT_ID &&
    process.env.ECPAY_HASH_KEY &&
    process.env.ECPAY_HASH_IV
  );
  const locked = isLocked(sub);
  const tierLabel = isTierKey(sub.tier) ? TIERS[sub.tier].label : sub.tier;
  const tierInfo = isTierKey(sub.tier) ? TIERS[sub.tier] : null;

  const statusBadge = {
    TRIALING: { text: `${tierLabel}方案・免費試用中，剩 ${sub.daysLeft} 天`, cls: "bg-sky-100 text-sky-700" },
    ACTIVE: {
      text: `${tierLabel}方案・${sub.plan === "YEARLY" ? "年繳" : "月繳"}・${sub.currentPeriodEnd?.toLocaleDateString("zh-TW")} 到期${sub.status === "CANCELED" ? "（已排定取消）" : ""}`,
      cls: "bg-emerald-100 text-emerald-700",
    },
    PAST_DUE: { text: "扣款失敗，請更新付款方式", cls: "bg-amber-100 text-amber-700" },
    EXPIRED: { text: "訂閱已到期，功能已鎖定", cls: "bg-red-100 text-red-700" },
    INACTIVE: { text: "尚未訂閱", cls: "bg-muted text-muted-foreground" },
  }[sub.effective];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-ink ink-texture">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gold" />
            <span className="font-brand text-xl font-bold text-white">
              Beauty<span className="text-gold">Time</span>
            </span>
          </div>
          {!locked && (
            <Link href="/dashboard" className="text-sm text-white/60 hover:text-white inline-flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> 回管理後台
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="font-brand text-center text-3xl font-bold mb-2">訂閱方案</h1>
        <div className="flex flex-col items-center gap-1.5 mb-8">
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusBadge.cls}`}>
            {statusBadge.text}
          </span>
          {tierInfo && !locked && (
            <span className="text-xs text-muted-foreground">
              目前用量：員工 {usage.staffCount} / {tierInfo.staffLimit} 位・門市 {usage.storeCount} / {tierInfo.storeLimit} 間
            </span>
          )}
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
            <PlanCards
              tiers={(Object.keys(TIERS) as (keyof typeof TIERS)[]).map((k) => ({
                key: k,
                label: TIERS[k].label,
                monthly: TIERS[k].monthly,
                yearly: yearlyPrice(k),
                staffLimit: TIERS[k].staffLimit,
                storeLimit: TIERS[k].storeLimit,
              }))}
              currentTier={sub.tier}
              trialUsed={sub.trialUsed}
              isActive={sub.effective === "ACTIVE" || sub.effective === "TRIALING"}
              contactEmail={me.email}
            />
            <div className="mt-6 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {gatewayConfigured
                  ? "付款由綠界 ECPay 安全處理（信用卡定期定額），卡號不經過本系統。"
                  : "目前為示範模式：點擊訂閱會直接開通。設定綠界 ECPay 金鑰後即切換為線上刷卡（定期定額自動扣款）。"}
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
