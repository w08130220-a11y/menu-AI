import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// 管理者切換檢視分店
export async function POST(request: Request) {
  const me = await getSession();
  if (!me || me.role !== "ADMIN") {
    return NextResponse.json({ error: "僅管理者可切換分店" }, { status: 403 });
  }
  const { storeId } = await request.json();
  if (storeId !== "all") {
    const exists = await prisma.store.findUnique({ where: { id: storeId } });
    if (!exists) return NextResponse.json({ error: "分店不存在" }, { status: 404 });
  }
  const store = await cookies();
  store.set("bs_store", storeId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return NextResponse.json({ ok: true });
}
