import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  getSubscription,
  checkTierFits,
  isTierKey,
  TIERS,
  yearlyPrice,
  TRIAL_DAYS,
  type TierKey,
} from "@/lib/billing";
import { ecpayConfigured, buildPeriodCheckout } from "@/lib/ecpay";

// 訂閱結帳：{ tier: BASIC|PLUS|PRO, cycle: MONTHLY|YEARLY }
// - 首次訂閱：直接開通 7 天免費試用（不收款、不填卡）
// - 已用過試用＋已設定綠界：回傳定期定額付款表單參數，由前端導向綠界刷卡
// - 未設定綠界：示範模式直接開通
export async function POST(request: Request) {
  const me = await getSession();
  if (!me || me.role !== "ADMIN") {
    return NextResponse.json({ error: "僅主帳號可管理訂閱" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  if (!isTierKey(body.tier) || (body.cycle !== "MONTHLY" && body.cycle !== "YEARLY")) {
    return NextResponse.json({ error: "方案錯誤" }, { status: 400 });
  }
  const tier = body.tier as TierKey;
  const cycle = body.cycle as "MONTHLY" | "YEARLY";

  // 用量不能超過目標方案額度（避免降級後超編）
  const fitError = await checkTierFits(tier);
  if (fitError) return NextResponse.json({ error: fitError }, { status: 400 });

  const sub = await getSubscription();
  const now = Date.now();
  const periodMs = (cycle === "YEARLY" ? 365 : 30) * 86400000;
  const amount = cycle === "YEARLY" ? yearlyPrice(tier) : TIERS[tier].monthly;

  // 首次訂閱 → 免費試用 7 天（不經金流）
  if (!sub.trialUsed) {
    const trialEnd = new Date(now + TRIAL_DAYS * 86400000);
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        tier,
        plan: cycle,
        status: "TRIALING",
        trialUsed: true,
        trialEndsAt: trialEnd,
      },
    });
    return NextResponse.json({ ok: true, trial: true });
  }

  // 綠界定期定額
  if (ecpayConfigured()) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const checkout = buildPeriodCheckout({
      tier,
      tierLabel: TIERS[tier].label,
      cycle,
      amount,
      subscriptionId: sub.id,
      appUrl,
    });
    return NextResponse.json({
      ecpay: { action: checkout.action, params: checkout.params },
    });
  }

  // ── 示範模式 ──
  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      tier,
      plan: cycle,
      status: "ACTIVE",
      currentPeriodEnd: new Date(now + periodMs),
    },
  });
  return NextResponse.json({ ok: true, demo: true, amount });
}
