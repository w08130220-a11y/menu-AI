import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// 取得（必要時建立）自己的行事曆訂閱金鑰；{ regenerate: true } 可重新產生使舊連結失效
export async function POST(request: Request) {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  let token = me.calendarToken;
  if (!token || body.regenerate === true) {
    token = randomBytes(24).toString("hex");
    await prisma.staff.update({
      where: { id: me.id },
      data: { calendarToken: token },
    });
  }
  return NextResponse.json({ token });
}
