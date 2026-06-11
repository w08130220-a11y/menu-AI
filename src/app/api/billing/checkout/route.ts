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
} from "@/lib/billing";
import { getStripe, stripePriceId } from "@/lib/stripe";

// 訂閱結帳：{ tier: BASIC|PLUS|PRO, cycle: MONTHLY|YEARLY }
// - 已設定 Stripe：建立 Checkout Session（首次訂閱附 7 天試用）
// - 未設定 Stripe：示範模式直接開通
export async function POST(request: Request) {
  const me = await getSession();
  if (!me || me.role !== "ADMIN") {
    return NextResponse.json({ error: "僅主帳號可管理訂閱" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  if (!isTierKey(body.tier) || (body.cycle !== "MONTHLY" && body.cycle !== "YEARLY")) {
    return NextResponse.json({ error: "方案錯誤" }, { status: 400 });
  }
  const tier = body.tier as import("@/lib/billing").TierKey;
  const cycle = body.cycle as "MONTHLY" | "YEARLY";

  // 用量不能超過目標方案額度（避免降級後超編）
  const fitError = await checkTierFits(tier);
  if (fitError) return NextResponse.json({ error: fitError }, { status: 400 });

  const sub = await getSubscription();
  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (stripe) {
    const priceId = stripePriceId(tier, cycle);
    if (!priceId) {
      return NextResponse.json(
        { error: `尚未設定 STRIPE_PRICE_${tier}_${cycle} 環境變數` },
        { status: 500 }
      );
    }
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      ...(sub.stripeCustomerId
        ? { customer: sub.stripeCustomerId }
        : { customer_email: me.email }),
      subscription_data: {
        metadata: { subscriptionRecordId: sub.id, tier, cycle },
        ...(sub.trialUsed ? {} : { trial_period_days: TRIAL_DAYS }),
      },
      success_url: `${appUrl}/billing?success=1`,
      cancel_url: `${appUrl}/billing`,
    });
    return NextResponse.json({ url: session.url });
  }

  // ── 示範模式 ──
  const now = Date.now();
  const periodMs = (cycle === "YEARLY" ? 365 : 30) * 86400000;
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
        currentPeriodEnd: new Date(trialEnd.getTime() + periodMs),
      },
    });
    return NextResponse.json({ ok: true, demo: true, trial: true });
  }
  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      tier,
      plan: cycle,
      status: "ACTIVE",
      currentPeriodEnd: new Date(now + periodMs),
    },
  });
  return NextResponse.json({
    ok: true,
    demo: true,
    amount: cycle === "YEARLY" ? yearlyPrice(tier) : TIERS[tier].monthly,
  });
}
