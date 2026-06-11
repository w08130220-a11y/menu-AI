import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isManager, hashPassword } from "@/lib/session";

export async function POST(request: Request) {
  const me = await getSession();
  if (!me || !isManager(me)) return NextResponse.json({ error: "需要管理者權限" }, { status: 403 });

  const body = await request.json();
  const { name, email, password, role, title, phone, payType, baseSalary, hourlyRate, serviceCommission, productCommission, color } = body;
  if (!name || !email || !password) {
    return NextResponse.json({ error: "姓名、Email、密碼為必填" }, { status: 400 });
  }
  const exists = await prisma.staff.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Email 已被使用" }, { status: 409 });

  const staff = await prisma.staff.create({
    data: {
      storeId: me.storeId,
      name,
      email,
      password: hashPassword(password),
      role: role === "MANAGER" ? "MANAGER" : "STAFF",
      title: title || null,
      phone: phone || null,
      payType: payType === "HOURLY" ? "HOURLY" : "MONTHLY",
      baseSalary: Number(baseSalary) || 0,
      hourlyRate: Number(hourlyRate) || 0,
      serviceCommission: Number(serviceCommission) || 0,
      productCommission: Number(productCommission) || 0,
      color: color || "#f97316",
    },
  });
  return NextResponse.json({ id: staff.id });
}
