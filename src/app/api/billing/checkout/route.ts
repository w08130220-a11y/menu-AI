import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getSubscription, PLANS, TRIAL_DAYS } from "@/lib/billing";
import { getStripe, stripePriceId } from "@/lib/stripe";

// 訂閱結帳。
// - 已設定 Stripe：建立 Checkout Session 並回傳付款頁網址（月繳首次附 7 天試用）
// - 未設定 Stripe：示範模式，直接開通（試用或正式期間）
export async function POST(request: Request) {
  const me = await getSession();
  if (!me || me.role !== "ADMIN") {
    return NextResponse.json({ error: "僅主帳號可管理訂閱" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  if (body.plan !== "MONTHLY" && body.plan !== "YEARLY") {
    return NextResponse.json({ error: "方案錯誤" }, { status: 400 });
  }
  const plan = body.plan as "MONTHLY" | "YEARLY";

  const sub = await getSubscription();
  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (stripe) {
    const priceId = stripePriceId(plan);
    if (!priceId) {
      return NextResponse.json(
        { error: `尚未設定 ${plan === "MONTHLY" ? "STRIPE_PRICE_MONTHLY" : "STRIPE_PRICE_YEARLY"}` },
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
        metadata: { subscriptionRecordId: sub.id, plan },
        ...(sub.trialUsed ? {} : { trial_period_days: TRIAL_DAYS }),
      },
      success_url: `${appUrl}/billing?success=1`,
      cancel_url: `${appUrl}/billing`,
    });
    return NextResponse.json({ url: session.url });
  }

  // ── 示範模式 ──
  const now = Date.now();
  const periodMs = PLANS[plan].periodDays * 86400000;
  if (!sub.trialUsed) {
    const trialEnd = new Date(now + TRIAL_DAYS * 86400000);
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        plan,
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
      plan,
      status: "ACTIVE",
      currentPeriodEnd: new Date(now + periodMs),
    },
  });
  return NextResponse.json({ ok: true, demo: true });
}
