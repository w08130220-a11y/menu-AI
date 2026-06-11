import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getSubscription } from "@/lib/billing";
import { getStripe } from "@/lib/stripe";

// 取消訂閱（期末生效，期間內仍可使用）
export async function POST() {
  const me = await getSession();
  if (!me || me.role !== "ADMIN") {
    return NextResponse.json({ error: "僅主帳號可管理訂閱" }, { status: 403 });
  }
  const sub = await getSubscription();
  const stripe = getStripe();

  if (stripe && sub.stripeSubscriptionId) {
    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  }
  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: "CANCELED" },
  });
  return NextResponse.json({ ok: true });
}
