import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { verifyPassword, hashPassword, isLegacyHash } from "@/lib/password";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  // 防暴力破解：每 IP 每分鐘最多 5 次嘗試
  const ip = clientIp(request);
  if (!rateLimit(`login:${ip}`, 5, 60_000).ok) {
    return NextResponse.json({ error: "嘗試次數過多，請 1 分鐘後再試" }, { status: 429 });
  }

  const { email, password } = await request.json().catch(() => ({}));
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return NextResponse.json({ error: "請輸入帳號與密碼" }, { status: 400 });
  }
  const staff = await prisma.staff.findUnique({ where: { email } });
  if (!staff || !staff.active || !verifyPassword(password, staff.password)) {
    return NextResponse.json({ error: "帳號或密碼錯誤" }, { status: 401 });
  }

  // 舊版雜湊自動升級為 scrypt+salt
  if (isLegacyHash(staff.password)) {
    await prisma.staff.update({
      where: { id: staff.id },
      data: { password: hashPassword(password) },
    });
  }

  await createSession(staff.id);
  return NextResponse.json({ ok: true });
}
