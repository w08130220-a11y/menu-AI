import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

// Stripe Webhook：驗證簽章後同步訂閱狀態。
// Stripe Dashboard 需設定事件：checkout.session.completed、
// customer.subscription.updated、customer.subscription.deleted
export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Stripe 未設定" }, { status: 501 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "缺少簽章" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      await request.text(),
      signature,
      secret
    );
  } catch {
    return NextResponse.json({ error: "簽章驗證失敗" }, { status: 400 });
  }

  const record = await prisma.subscription.findFirst();
  if (!record) return NextResponse.json({ ok: true });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    await prisma.subscription.update({
      where: { id: record.id },
      data: {
        stripeCustomerId: String(session.customer ?? "") || null,
        stripeSubscriptionId: String(session.subscription ?? "") || null,
      },
    });
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted" ||
    event.type === "customer.subscription.created"
  ) {
    const s = event.data.object;
    const statusMap: Record<string, string> = {
      trialing: "TRIALING",
      active: "ACTIVE",
      past_due: "PAST_DUE",
      canceled: "CANCELED",
      unpaid: "PAST_DUE",
      incomplete: "INACTIVE",
      incomplete_expired: "INACTIVE",
    };
    const periodEnd = s.items.data[0]?.current_period_end;
    await prisma.subscription.update({
      where: { id: record.id },
      data: {
        status: statusMap[s.status] ?? "INACTIVE",
        plan: (s.metadata?.plan as string) || record.plan,
        stripeSubscriptionId: s.id,
        stripeCustomerId: String(s.customer),
        trialUsed: true,
        trialEndsAt: s.trial_end ? new Date(s.trial_end * 1000) : record.trialEndsAt,
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : record.currentPeriodEnd,
      },
    });
  }

  return NextResponse.json({ received: true });
}
