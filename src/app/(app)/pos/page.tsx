import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { fmtMoney, PAYMENT_METHODS } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PosClient } from "./pos-client";

export default async function PosPage() {
  const me = await getSession();
  if (!me) redirect("/login");

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [services, products, staffList, customers, todaySales] = await Promise.all([
    prisma.service.findMany({ where: { active: true }, orderBy: [{ category: "asc" }, { price: "asc" }] }),
    prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.staff.findMany({ where: { active: true }, select: { id: true, name: true } }),
    prisma.customer.findMany({
      select: { id: true, name: true, phone: true, balance: true },
      orderBy: { name: "asc" },
    }),
    prisma.sale.findMany({
      where: { createdAt: { gte: startOfToday } },
      include: { items: true, customer: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">POS 收款</h1>
        <p className="text-muted-foreground text-sm">點選服務或產品 → 指定業績歸屬 → 收款</p>
      </div>

      <PosClient
        services={services}
        products={products}
        staffList={staffList}
        customers={customers}
        meId={me.id}
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">今日結帳紀錄</CardTitle>
        </CardHeader>
        <CardContent>
          {todaySales.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">今天還沒有結帳</p>
          ) : (
            <div className="divide-y">
              {todaySales.map((s) => (
                <div key={s.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="font-mono text-muted-foreground w-12">
                    {s.createdAt.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false })}
                  </span>
                  <span className="w-16 truncate font-medium">{s.customer?.name ?? "散客"}</span>
                  <span className="flex-1 truncate text-muted-foreground">
                    {s.items.map((i) => `${i.name}×${i.qty}`).join("、")}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                    {PAYMENT_METHODS[s.paymentMethod]}
                  </span>
                  <span className="font-mono font-medium">{fmtMoney(s.total)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
