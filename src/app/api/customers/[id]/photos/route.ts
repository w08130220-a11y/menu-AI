import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const ALLOWED = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// 上傳顧客施作紀錄照片（multipart form-data：file, caption）
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) return NextResponse.json({ error: "找不到顧客" }, { status: 404 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const caption = String(form?.get("caption") ?? "").slice(0, 100);
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "請選擇圖片" }, { status: 400 });
  }
  const ext = ALLOWED.get(file.type);
  if (!ext) {
    return NextResponse.json({ error: "僅支援 JPG / PNG / WebP 圖片" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "圖片大小上限 5MB" }, { status: 400 });
  }

  const fileName = `${randomBytes(16).toString("hex")}${ext}`;
  const dir = path.join(process.cwd(), "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fileName), Buffer.from(await file.arrayBuffer()));

  const photo = await prisma.customerPhoto.create({
    data: { customerId: id, fileName, caption: caption || null },
  });
  return NextResponse.json(photo);
}
