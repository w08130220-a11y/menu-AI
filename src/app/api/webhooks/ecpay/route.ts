import { prisma } from "@/lib/prisma";
import { ecpayConfigured, verifyMac } from "@/lib/ecpay";

// 綠界付款結果通知（首期授權 ReturnURL ＋ 每期扣款 PeriodReturnURL 共用）。
// 驗證 CheckMacValue 後開通 / 延展訂閱期間；須回應「1|OK」。
export async function POST(request: Request) {
  if (!ecpayConfigured()) {
    return new Response("0|NotConfigured", { status: 501 });
  }

  const form = await request.formData().catch(() => null);
  if (!form) return new Response("0|BadRequest", { status: 400 });
  const params: Record<string, string> = {};
  for (const [k, v] of form.entries()) params[k] = String(v);

  if (!verifyMac(params)) {
    return new Response("0|CheckMacValueError", { status: 400 });
  }

  // RtnCode 1 = 付款成功（定期定額每期成功亦為 1）
  if (params.RtnCode === "1") {
    const tier = ["BASIC", "PLUS", "PRO"].includes(params.CustomField1)
      ? params.CustomField1
      : null;
    const cycle = params.CustomField2 === "YEARLY" ? "YEARLY" : "MONTHLY";
    const subId = params.CustomField3;
    const record = subId
      ? await prisma.subscription.findUnique({ where: { id: subId } })
      : await prisma.subscription.findFirst();
    if (record) {
      const periodMs = (cycle === "YEARLY" ? 365 : 30) * 86400000;
      // 期間從「現有到期日」或「現在」起算，扣款成功即往後延一期
      const base = Math.max(record.currentPeriodEnd?.getTime() ?? 0, Date.now());
      await prisma.subscription.update({
        where: { id: record.id },
        data: {
          ...(tier ? { tier } : {}),
          plan: cycle,
          status: "ACTIVE",
          trialUsed: true,
          currentPeriodEnd: new Date(base + periodMs),
          ecpayMerchantTradeNo: params.MerchantTradeNo ?? record.ecpayMerchantTradeNo,
        },
      });
    }
  }

  return new Response("1|OK");
}
