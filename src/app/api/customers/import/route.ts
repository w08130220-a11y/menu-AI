import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const rowSchema = z.object({
  name: z.string().trim().min(1).max(30),
  phone: z.string().trim().min(8).max(20),
  email: z.string().trim().max(100).optional().nullable(),
  gender: z.string().optional().nullable(),
  birthday: z.string().optional().nullable(),
  tags: z.string().max(100).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  balance: z.coerce.number().int().min(0).optional(),
});

// 顧客批次匯入（CSV 解析後的資料列）。以電話為唯一鍵，已存在者略過。
export async function POST(request: Request) {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const rows: unknown[] = Array.isArray(body.rows) ? body.rows : [];
  if (rows.length === 0) return NextResponse.json({ error: "沒有可匯入的資料" }, { status: 400 });
  if (rows.length > 1000) {
    return NextResponse.json({ error: "單次最多匯入 1000 筆，請分批" }, { status: 400 });
  }

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const [i, raw] of rows.entries()) {
    const parsed = rowSchema.safeParse(raw);
    if (!parsed.success) {
      errors.push(`第 ${i + 1} 列：姓名或電話格式錯誤`);
      skipped += 1;
      continue;
    }
    const r = parsed.data;
    const gender = r.gender === "男" || r.gender === "M" ? "M" : r.gender === "女" || r.gender === "F" ? "F" : null;
    const exists = await prisma.customer.findUnique({ where: { phone: r.phone } });
    if (exists) {
      skipped += 1;
      continue;
    }
    await prisma.customer.create({
      data: {
        name: r.name,
        phone: r.phone,
        email: r.email || null,
        gender,
        birthday: r.birthday && /^\d{4}-\d{2}-\d{2}$/.test(r.birthday) ? r.birthday : null,
        tags: r.tags || null,
        note: r.note || null,
        balance: r.balance ?? 0,
      },
    });
    created += 1;
  }

  return NextResponse.json({ created, skipped, errors: errors.slice(0, 10) });
}
