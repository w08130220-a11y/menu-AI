import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createCheckoutSession, createPortalSession } from "@/lib/stripe";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user already has an active subscription
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        stripeCurrentPeriodEnd: true,
      },
    });

    // If user has active subscription, redirect to billing portal
    if (
      user?.stripeSubscriptionId &&
      user?.stripeCurrentPeriodEnd &&
      user.stripeCurrentPeriodEnd > new Date()
    ) {
      if (user.stripeCustomerId) {
        const { url } = await createPortalSession(user.stripeCustomerId);
        return NextResponse.json({ url });
      }
    }

    // Create new checkout session
    const { url } = await createCheckoutSession(
      session.user.id,
      session.user.email
    );

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
