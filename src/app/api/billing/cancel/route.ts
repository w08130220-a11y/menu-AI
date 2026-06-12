import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getSubscription } from "@/lib/billing";
import { ecpayConfigured, cancelPeriod } from "@/lib/ecpay";

// 取消訂閱（期末生效，期間內仍可使用）
export async function POST() {
  const me = await getSession();
  if (!me || me.role !== "ADMIN") {
    return NextResponse.json({ error: "僅主帳號可管理訂閱" }, { status: 403 });
  }
  const sub = await getSubscription();

  let gatewayCanceled = true;
  if (ecpayConfigured() && sub.ecpayMerchantTradeNo) {
    gatewayCanceled = await cancelPeriod(sub.ecpayMerchantTradeNo);
  }
  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: "CANCELED" },
  });
  return NextResponse.json({
    ok: true,
    note: gatewayCanceled
      ? undefined
      : "系統已標記取消，但綠界端終止失敗，請至綠界後台「定期定額查詢」手動終止，以免持續扣款",
  });
}
