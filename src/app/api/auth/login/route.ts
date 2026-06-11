import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/session";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: "請輸入帳號與密碼" }, { status: 400 });
  }
  const staff = await prisma.staff.findUnique({ where: { email } });
  if (!staff || !staff.active || staff.password !== hashPassword(password)) {
    return NextResponse.json({ error: "帳號或密碼錯誤" }, { status: 401 });
  }
  await createSession(staff.id);
  return NextResponse.json({ ok: true });
}
