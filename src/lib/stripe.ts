import Stripe from "stripe";

// 設定 STRIPE_SECRET_KEY 後即啟用真實金流；未設定時訂閱頁以示範模式運作
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export function stripePriceId(plan: "MONTHLY" | "YEARLY") {
  return plan === "MONTHLY"
    ? process.env.STRIPE_PRICE_MONTHLY
    : process.env.STRIPE_PRICE_YEARLY;
}
