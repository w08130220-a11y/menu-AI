import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isManager, hashPassword } from "@/lib/session";
import { getSubscription, getUsage, isTierKey, TIERS } from "@/lib/billing";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getSession();
  if (!me || !isManager(me)) return NextResponse.json({ error: "需要管理者權限" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();

  const target = await prisma.staff.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "找不到員工" }, { status: 404 });
  if (target.role === "ADMIN" && me.role !== "ADMIN") {
    return NextResponse.json({ error: "無法修改管理者" }, { status: 403 });
  }

  // 重新啟用員工時檢查方案員工數上限
  if (body.active === true && !target.active && target.role !== "ADMIN") {
    const sub = await getSubscription();
    const tier = isTierKey(sub.tier) ? TIERS[sub.tier] : TIERS.BASIC;
    const { staffCount } = await getUsage();
    if (staffCount >= tier.staffLimit) {
      return NextResponse.json(
        { error: `「${tier.label}」方案最多 ${tier.staffLimit} 位員工，請至「訂閱方案」升級後再啟用` },
        { status: 403 }
      );
    }
  }

  const updated = await prisma.staff.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.title !== undefined && { title: body.title || null }),
      ...(body.phone !== undefined && { phone: body.phone || null }),
      ...(body.role !== undefined && target.role !== "ADMIN" && {
        role: body.role === "MANAGER" ? "MANAGER" : "STAFF",
      }),
      ...(body.payType !== undefined && { payType: body.payType === "HOURLY" ? "HOURLY" : "MONTHLY" }),
      ...(body.baseSalary !== undefined && { baseSalary: Number(body.baseSalary) || 0 }),
      ...(body.hourlyRate !== undefined && { hourlyRate: Number(body.hourlyRate) || 0 }),
      ...(body.serviceCommission !== undefined && { serviceCommission: Number(body.serviceCommission) || 0 }),
      ...(body.productCommission !== undefined && { productCommission: Number(body.productCommission) || 0 }),
      ...(body.color !== undefined && { color: body.color }),
      ...(body.active !== undefined && target.role !== "ADMIN" && { active: !!body.active }),
      // 頁籤權限僅主帳號可設定；空陣列存為僅打卡，null 表示恢復預設
      ...(me.role === "ADMIN" && body.permissions !== undefined
        ? { permissions: Array.isArray(body.permissions) ? body.permissions.join(",") : null }
        : {}),
      ...(body.password ? { password: hashPassword(body.password) } : {}),
    },
  });
  return NextResponse.json({ id: updated.id });
}
