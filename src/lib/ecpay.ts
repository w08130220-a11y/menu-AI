import { createHash } from "crypto";

// 綠界 ECPay 信用卡定期定額。
// 設定 ECPAY_MERCHANT_ID / ECPAY_HASH_KEY / ECPAY_HASH_IV 即啟用；
// ECPAY_STAGE=false 切換正式環境（預設使用測試環境）。

export function ecpayConfigured() {
  return !!(
    process.env.ECPAY_MERCHANT_ID &&
    process.env.ECPAY_HASH_KEY &&
    process.env.ECPAY_HASH_IV
  );
}

const baseUrl = () =>
  process.env.ECPAY_STAGE === "false"
    ? "https://payment.ecpay.com.tw"
    : "https://payment-stage.ecpay.com.tw";

// 綠界 CheckMacValue（SHA256）：參數依鍵名排序 → 前後加 HashKey/HashIV →
// .NET 式 URL encode → 轉小寫 → SHA256 → 轉大寫
export function checkMacValue(params: Record<string, string>) {
  const sorted = Object.keys(params)
    .sort((a, b) => a.localeCompare(b))
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const raw = `HashKey=${process.env.ECPAY_HASH_KEY}&${sorted}&HashIV=${process.env.ECPAY_HASH_IV}`;
  // 對齊 .NET HttpUtility.UrlEncode：空白→+、~ 與 ' 需編碼，- _ . ! * ( ) 保留
  const encoded = encodeURIComponent(raw)
    .replace(/%20/g, "+")
    .replace(/~/g, "%7e")
    .replace(/'/g, "%27")
    .toLowerCase();
  return createHash("sha256").update(encoded).digest("hex").toUpperCase();
}

export function verifyMac(params: Record<string, string>) {
  const { CheckMacValue, ...rest } = params;
  if (!CheckMacValue) return false;
  return checkMacValue(rest) === CheckMacValue;
}

const tradeDate = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

// 建立定期定額結帳表單（由前端自動 POST 至綠界付款頁）
export function buildPeriodCheckout(opts: {
  tier: string;
  tierLabel: string;
  cycle: "MONTHLY" | "YEARLY";
  amount: number;
  subscriptionId: string;
  appUrl: string;
}) {
  const merchantTradeNo = `BT${Date.now()}${Math.floor(Math.random() * 90 + 10)}`; // ≤20 字元
  const params: Record<string, string> = {
    MerchantID: process.env.ECPAY_MERCHANT_ID!,
    MerchantTradeNo: merchantTradeNo,
    MerchantTradeDate: tradeDate(),
    PaymentType: "aio",
    TotalAmount: String(opts.amount),
    TradeDesc: "BeautyTime 系統訂閱",
    ItemName: `BeautyTime ${opts.tierLabel}方案（${opts.cycle === "YEARLY" ? "年繳" : "月繳"}）`,
    ReturnURL: `${opts.appUrl}/api/webhooks/ecpay`,
    ChoosePayment: "Credit",
    EncryptType: "1",
    ClientBackURL: `${opts.appUrl}/billing`,
    // 定期定額：每期金額與首期相同；月繳最多 99 期、年繳最多 9 期（到期前可再續）
    PeriodAmount: String(opts.amount),
    PeriodType: opts.cycle === "YEARLY" ? "Y" : "M",
    Frequency: "1",
    ExecTimes: opts.cycle === "YEARLY" ? "9" : "99",
    PeriodReturnURL: `${opts.appUrl}/api/webhooks/ecpay`,
    // 自訂欄位：webhook 據此開通對應方案
    CustomField1: opts.tier,
    CustomField2: opts.cycle,
    CustomField3: opts.subscriptionId,
  };
  params.CheckMacValue = checkMacValue(params);
  return {
    action: `${baseUrl()}/Cashier/AioCheckOut/V5`,
    params,
    merchantTradeNo,
  };
}

// 終止定期定額（最佳努力；失敗時請至綠界後台手動終止）
export async function cancelPeriod(merchantTradeNo: string) {
  const params: Record<string, string> = {
    MerchantID: process.env.ECPAY_MERCHANT_ID!,
    MerchantTradeNo: merchantTradeNo,
    Action: "Cancel",
    TimeStamp: String(Math.floor(Date.now() / 1000)),
  };
  params.CheckMacValue = checkMacValue(params);
  try {
    const res = await fetch(`${baseUrl()}/Cashier/CreditCardPeriodAction`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params).toString(),
    });
    const text = await res.text();
    return text.includes("RtnCode=1");
  } catch {
    return false;
  }
}
