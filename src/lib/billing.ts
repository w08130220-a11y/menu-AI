import { prisma } from "@/lib/prisma";

// 訂閱方案分級（TWD/月）。年繳一次付清一律 8 折。
export const TIERS = {
  BASIC: {
    label: "基礎",
    monthly: 399,
    staffLimit: 5, // 主帳號另計
    storeLimit: 1, // 單一門市（無分店）
    desc: "主帳號＋5 位員工・單一門市",
  },
  PLUS: {
    label: "進階",
    monthly: 599,
    staffLimit: 20,
    storeLimit: 2,
    desc: "主帳號＋20 位員工・最多 2 間門市",
  },
  PRO: {
    label: "專業",
    monthly: 799,
    staffLimit: 50,
    storeLimit: 5,
    desc: "主帳號＋50 位員工・最多 5 間門市",
  },
} as const;

export type TierKey = keyof typeof TIERS;
export const YEARLY_DISCOUNT = 0.8;
export const TRIAL_DAYS = 7;

export function yearlyPrice(tier: TierKey) {
  return Math.round(TIERS[tier].monthly * 12 * YEARLY_DISCOUNT);
}

export function isTierKey(v: unknown): v is TierKey {
  return v === "BASIC" || v === "PLUS" || v === "PRO";
}

export type SubscriptionInfo = {
  id: string;
  tier: string;
  plan: string;
  status: string;
  trialUsed: boolean;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
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

// 目前用量（員工數不含主帳號）
export async function getUsage() {
  const [staffCount, storeCount] = await Promise.all([
    prisma.staff.count({ where: { active: true, role: { not: "ADMIN" } } }),
    prisma.store.count(),
  ]);
  return { staffCount, storeCount };
}

// 方案額度檢查；回傳 null 表示通過，否則為錯誤訊息
export async function checkTierFits(tier: TierKey): Promise<string | null> {
  const { staffCount, storeCount } = await getUsage();
  const t = TIERS[tier];
  if (staffCount > t.staffLimit) {
    return `目前有 ${staffCount} 位員工，超過「${t.label}」方案上限（${t.staffLimit} 位），請先停用多餘員工或選擇更高方案`;
  }
  if (storeCount > t.storeLimit) {
    return `目前有 ${storeCount} 間門市，超過「${t.label}」方案上限（${t.storeLimit} 間），請選擇更高方案`;
  }
  return null;
}
