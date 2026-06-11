import { createHmac, timingSafeEqual } from "crypto";

// LINE Messaging API 工具（使用商家自有官方帳號的金鑰）

export async function linePush(channelAccessToken: string, to: string, text: string) {
  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${channelAccessToken}`,
    },
    body: JSON.stringify({ to, messages: [{ type: "text", text }] }),
  });
  return res.ok;
}

export async function lineReply(channelAccessToken: string, replyToken: string, text: string) {
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${channelAccessToken}`,
    },
    body: JSON.stringify({ replyToken, messages: [{ type: "text", text }] }),
  }).catch(() => null);
}

// 驗證 LINE Webhook 簽章（X-Line-Signature）
export function verifyLineSignature(channelSecret: string, rawBody: string, signature: string | null) {
  if (!signature) return false;
  const expected = createHmac("sha256", channelSecret).update(rawBody).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function normalizePhone(input: string) {
  return input.replace(/\D/g, "").replace(/^886/, "0");
}
