import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const body = await request.json();
  const { name, phone, email, gender, birthday, note, tags } = body;
  if (!name || !phone) {
    return NextResponse.json({ error: "姓名與電話為必填" }, { status: 400 });
  }
  const exists = await prisma.customer.findUnique({ where: { phone } });
  if (exists) {
    return NextResponse.json({ error: "此電話已建檔" }, { status: 409 });
  }
  const customer = await prisma.customer.create({
    data: { name, phone, email: email || null, gender: gender || null, birthday: birthday || null, note: note || null, tags: tags || null },
  });
  return NextResponse.json(customer);
}
