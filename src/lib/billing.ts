import { prisma } from "@/lib/prisma";

// 訂閱方案定價（TWD）
export const PLANS = {
  MONTHLY: {
    label: "月繳方案",
    price: 499,
    periodDays: 30,
    note: "首次訂閱免費試用 7 天",
  },
  YEARLY: {
    label: "年繳方案（一次付清 8 折）",
    price: Math.round(499 * 0.8 * 12), // 4,790
    periodDays: 365,
    note: "相當於每月 NT$ 399，現省 NT$ 1,198",
  },
} as const;

export const TRIAL_DAYS = 7;

export type SubscriptionInfo = {
  id: string;
  plan: string;
  status: string;
  trialUsed: boolean;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  // 計算後的有效狀態
  effective: "TRIALING" | "ACTIVE" | "PAST_DUE" | "EXPIRED" | "INACTIVE";
  daysLeft: number | null;
};

// 取得（或初始化）整個帳戶的訂閱紀錄
export async function getSubscription(): Promise<SubscriptionInfo> {
  let sub = await prisma.subscription.findFirst();
  if (!sub) {
    sub = await prisma.subscription.create({ data: {} });
  }
  const now = Date.now();

  let effective: SubscriptionInfo["effective"] = "INACTIVE";
  let endAt: Date | null = null;

  if (sub.status === "TRIALING") {
    endAt = sub.trialEndsAt;
    effective = endAt && endAt.getTime() > now ? "TRIALING" : "EXPIRED";
  } else if (sub.status === "ACTIVE" || sub.status === "CANCELED") {
    endAt = sub.currentPeriodEnd;
    effective = endAt && endAt.getTime() > now ? "ACTIVE" : "EXPIRED";
  } else if (sub.status === "PAST_DUE") {
    effective = "PAST_DUE";
    endAt = sub.currentPeriodEnd;
  }

  const daysLeft = endAt ? Math.max(0, Math.ceil((endAt.getTime() - now) / 86400000)) : null;
  return { ...sub, effective, daysLeft };
}

export function isLocked(sub: SubscriptionInfo) {
  return sub.effective === "EXPIRED" || sub.effective === "INACTIVE";
}
