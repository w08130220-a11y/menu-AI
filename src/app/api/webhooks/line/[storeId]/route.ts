import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyLineSignature, lineReply, normalizePhone } from "@/lib/line";

// LINE 官方帳號 Webhook（每間分店一條：/api/webhooks/line/<storeId>）
// - 顧客加好友 → 回覆綁定說明
// - 顧客傳手機號碼 → 比對顧客資料完成 LINE 綁定，之後即可接收預約通知
export async function POST(
  request: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await params;
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store?.lineChannelSecret || !store.lineChannelAccessToken) {
    return NextResponse.json({ error: "此分店未設定 LINE" }, { status: 404 });
  }

  const rawBody = await request.text();
  if (!verifyLineSignature(store.lineChannelSecret, rawBody, request.headers.get("x-line-signature"))) {
    return NextResponse.json({ error: "簽章驗證失敗" }, { status: 401 });
  }

  const body = JSON.parse(rawBody) as {
    events?: {
      type: string;
      replyToken?: string;
      source?: { userId?: string };
      message?: { type: string; text?: string };
    }[];
  };

  for (const event of body.events ?? []) {
    const userId = event.source?.userId;
    if (!userId) continue;

    if (event.type === "follow" && event.replyToken) {
      await lineReply(
        store.lineChannelAccessToken,
        event.replyToken,
        `歡迎加入 ${store.name}！\n請直接傳送您「預約時填寫的手機號碼」完成綁定，之後預約確認與提醒都會透過 LINE 通知您。`
      );
      continue;
    }

    if (event.type === "message" && event.message?.type === "text" && event.replyToken) {
      const digits = normalizePhone(event.message.text ?? "");
      if (digits.length < 8) {
        // 非手機號碼訊息：已綁定者不打擾，未綁定者提示
        const bound = await prisma.customer.findFirst({ where: { lineUserId: userId } });
        if (!bound) {
          await lineReply(
            store.lineChannelAccessToken,
            event.replyToken,
            "請傳送您預約時填寫的手機號碼（例：0912345678）完成通知綁定。"
          );
        }
        continue;
      }

      // 以手機號碼比對顧客（忽略格式符號）
      const candidates = await prisma.customer.findMany({
        select: { id: true, name: true, phone: true },
      });
      const matched = candidates.find((c) => normalizePhone(c.phone) === digits);
      if (!matched) {
        await lineReply(
          store.lineChannelAccessToken,
          event.replyToken,
          "查無此手機號碼的預約資料，請確認號碼是否與預約時填寫的一致，或先完成一次線上預約。"
        );
        continue;
      }
      await prisma.customer.update({
        where: { id: matched.id },
        data: { lineUserId: userId },
      });
      await lineReply(
        store.lineChannelAccessToken,
        event.replyToken,
        `綁定成功！${matched.name} 您好，之後的預約確認與提醒都會透過 LINE 通知您。`
      );
    }
  }

  return NextResponse.json({ ok: true });
}
