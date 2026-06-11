import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isManager } from "@/lib/session";
import { SERVICE_CATEGORIES } from "@/lib/constants";

export async function POST(request: Request) {
  const me = await getSession();
  if (!me || !isManager(me)) return NextResponse.json({ error: "需要管理者權限" }, { status: 403 });

  const { name, category, price, durationMin, depositAmount, description } = await request.json();
  if (!name || !SERVICE_CATEGORIES[category] || !price) {
    return NextResponse.json({ error: "參數不足" }, { status: 400 });
  }
  const service = await prisma.service.create({
    data: {
      name,
      category,
      price: Number(price),
      durationMin: Number(durationMin) || 60,
      depositAmount: Math.max(0, Number(depositAmount) || 0),
      description: description || null,
    },
  });
  return NextResponse.json(service);
}
