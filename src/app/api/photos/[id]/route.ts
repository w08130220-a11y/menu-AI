import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { id } = await params;
  const photo = await prisma.customerPhoto.findUnique({ where: { id } });
  if (!photo) return NextResponse.json({ error: "找不到照片" }, { status: 404 });

  await prisma.customerPhoto.delete({ where: { id } });
  await unlink(path.join(process.cwd(), "uploads", path.basename(photo.fileName))).catch(() => null);
  return NextResponse.json({ ok: true });
}
