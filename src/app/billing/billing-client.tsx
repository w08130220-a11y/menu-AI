"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, BadgeCheck, Building2, Users, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Tier = {
  key: "BASIC" | "PLUS" | "PRO";
  label: string;
  monthly: number;
  yearly: number;
  staffLimit: number;
  storeLimit: number;
};

const FEATURES = [
  "線上預約＋LINE 通知",
  "POS 收款與儲值金",
  "排班、打卡與薪資計算",
  "顧客 CRM、療程券、施作照片",
  "營收報表分析",
];

const fmt = (n: number) => `NT$ ${n.toLocaleString("zh-TW")}`;

export function PlanCards({
  tiers,
  currentTier,
  trialUsed,
  isActive,
  contactEmail,
}: {
  tiers: Tier[];
  currentTier: string;
  trialUsed: boolean;
  isActive: boolean;
  contactEmail: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [cycle, setCycle] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  async function subscribe(tier: string) {
    setLoadingTier(tier);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier, cycle }),
    });
    const data = await res.json().catch(() => ({}));
    setLoadingTier(null);
    if (res.ok) {
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      toast({
        title: data.trial ? "已開始 7 天免費試用！" : "訂閱已開通",
        description: "示範模式（未串接金流，正式環境將導向 Stripe 付款頁）",
      });
      router.refresh();
    } else {
      toast({ title: data.error ?? "訂閱失敗", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      {/* 月繳 / 年繳切換 */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-full border bg-card p-1">
          <button
            onClick={() => setCycle("MONTHLY")}
            className={cn(
              "rounded-full px-5 py-1.5 text-sm font-medium",
              cycle === "MONTHLY" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}
          >
            月繳
          </button>
          <button
            onClick={() => setCycle("YEARLY")}
            className={cn(
              "rounded-full px-5 py-1.5 text-sm font-medium",
              cycle === "YEARLY" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}
          >
            年繳一次付清・8 折
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {tiers.map((t, i) => {
          const isCurrent = isActive && currentTier === t.key;
          const popular = t.key === "PLUS";
          return (
            <div
              key={t.key}
              className={cn(
                "relative rounded-2xl border bg-card p-5 flex flex-col",
                popular && "border-2 border-primary"
              )}
            >
              {popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-white">
                  最受歡迎
                </span>
              )}
              <h2 className="font-bold">{t.label}方案</h2>
              <p className="mt-2">
                <span className="text-3xl font-bold">
                  {fmt(cycle === "MONTHLY" ? t.monthly : t.yearly)}
                </span>
                <span className="text-muted-foreground text-sm">
                  {cycle === "MONTHLY" ? " / 月" : " / 年"}
                </span>
              </p>
              <p className="mt-1 text-xs h-4">
                {cycle === "YEARLY" ? (
                  <span className="text-primary font-medium">
                    相當於每月 {fmt(Math.round(t.yearly / 12))}，現省 {fmt(t.monthly * 12 - t.yearly)}
                  </span>
                ) : !trialUsed ? (
                  <span className="text-sky-600 font-medium">首次訂閱免費試用 7 天</span>
                ) : null}
              </p>
              <div className="mt-3 space-y-1.5 text-sm font-medium">
                <p className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  主帳號＋{t.staffLimit} 位員工
                </p>
                <p className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-primary" />
                  {t.storeLimit === 1 ? "單一門市" : `最多 ${t.storeLimit} 間門市`}
                </p>
              </div>
              <ul className="mt-3 mb-5 space-y-1.5 text-sm flex-1">
                {FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> {f}
                  </li>
                ))}
                {t.key !== "BASIC" && (
                  <li className="flex items-center gap-2 font-medium text-foreground">
                    <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                    多分店切換與跨店報表
                  </li>
                )}
              </ul>
              <Button
                onClick={() => subscribe(t.key)}
                disabled={loadingTier !== null || isCurrent}
                variant={popular ? "default" : "outline"}
                className="w-full"
              >
                {loadingTier === t.key
                  ? "處理中…"
                  : isCurrent
                    ? "目前方案"
                    : !trialUsed
                      ? "免費試用 7 天"
                      : isActive && i < tiers.findIndex((x) => x.key === currentTier)
                        ? "降級至此方案"
                        : "選擇此方案"}
              </Button>
            </div>
          );
        })}
      </div>

      {/* 企業客製 */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border bg-card p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted shrink-0">
          <Building2 className="h-5 w-5 text-foreground" />
        </div>
        <div className="flex-1 min-w-48">
          <p className="font-bold">大型連鎖 / 企業方案</p>
          <p className="text-sm text-muted-foreground">
            超過 50 位員工或 5 間門市？提供客製額度、專屬服務與合約報價。
          </p>
        </div>
        <Button asChild variant="outline">
          <a href={`mailto:${contactEmail}?subject=BeauHub 企業方案洽詢`}>聯絡我們</a>
        </Button>
      </div>
    </div>
  );
}

export function CancelButton() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function cancel() {
    if (!confirm("確定取消訂閱？目前期間結束前仍可正常使用。")) return;
    setLoading(true);
    const res = await fetch("/api/billing/cancel", { method: "POST" });
    setLoading(false);
    if (res.ok) {
      toast({ title: "已排定期末取消", description: "期間結束前功能不受影響" });
      router.refresh();
    } else {
      toast({ title: "取消失敗", variant: "destructive" });
    }
  }

  return (
    <button
      onClick={cancel}
      disabled={loading}
      className="text-xs text-muted-foreground underline hover:text-destructive"
    >
      取消訂閱
    </button>
  );
}
