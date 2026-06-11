import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession, isManager } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fmtMoney, SERVICE_CATEGORIES } from "@/lib/constants";
import { ChevronLeft, ChevronRight } from "lucide-react";

function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  return {
    start: new Date(y, m - 1, 1),
    end: new Date(y, m, 1),
    prev: `${m === 1 ? y - 1 : y}-${String(m === 1 ? 12 : m - 1).padStart(2, "0")}`,
    next: `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, "0")}`,
  };
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const me = await getSession();
  if (!me) redirect("/login");
  if (!isManager(me)) redirect("/dashboard");

  const params = await searchParams;
  const now = new Date();
  const month = params.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const { start, end, prev, next } = monthRange(month);

  const [stores, sales, appointments, services] = await Promise.all([
    prisma.store.findMany({ orderBy: { name: "asc" }, include: { staff: { select: { id: true } } } }),
    prisma.sale.findMany({
      where: { createdAt: { gte: start, lt: end } },
      include: {
        cashier: { select: { storeId: true } },
        items: { select: { itemType: true, serviceId: true, subtotal: true } },
      },
    }),
    prisma.appointment.findMany({
      where: { date: { gte: month + "-01", lt: monthRange(month).next + "-01" } },
      include: { staff: { select: { storeId: true } } },
    }),
    prisma.service.findMany({ select: { id: true, category: true } }),
  ]);

  const categoryOf = new Map(services.map((s) => [s.id, s.category]));

  const rows = stores.map((store) => {
    const storeSales = sales.filter((s) => s.cashier.storeId === store.id);
    const revenue = storeSales.reduce((a, s) => a + s.total, 0);
    const serviceRevenue = storeSales
      .flatMap((s) => s.items)
      .filter((i) => i.itemType === "SERVICE")
      .reduce((a, i) => a + i.subtotal, 0);
    const productRevenue = storeSales
      .flatMap((s) => s.items)
      .filter((i) => i.itemType === "PRODUCT")
      .reduce((a, i) => a + i.subtotal, 0);
    const storeAppts = appointments.filter((a) => a.staff.storeId === store.id);
    const completed = storeAppts.filter((a) => a.status === "COMPLETED").length;
    const noShow = storeAppts.filter((a) => a.status === "NO_SHOW").length;

    // 服務類別營收占比
    const byCategory: Record<string, number> = {};
    for (const s of storeSales) {
      for (const i of s.items) {
        if (i.itemType !== "SERVICE" || !i.serviceId) continue;
        const cat = categoryOf.get(i.serviceId) ?? "OTHER";
        byCategory[cat] = (byCategory[cat] ?? 0) + i.subtotal;
      }
    }

    return {
      store,
      revenue,
      serviceRevenue,
      productRevenue,
      txCount: storeSales.length,
      avgTicket: storeSales.length ? Math.round(revenue / storeSales.length) : 0,
      apptCount: storeAppts.length,
      completed,
      noShow,
      staffCount: store.staff.length,
      byCategory,
    };
  });

  const totalRevenue = rows.reduce((a, r) => a + r.revenue, 0);
  const maxRevenue = Math.max(...rows.map((r) => r.revenue), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">跨店報表</h1>
          <p className="text-muted-foreground text-sm">
            {month.replace("-", " 年 ")} 月・全品牌營收 {fmtMoney(totalRevenue)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/reports?month=${prev}`}>
              <ChevronLeft className="h-4 w-4" /> 上個月
            </Link>
          </Button>
          <span className="text-sm font-medium px-1">{month}</span>
          <Button asChild variant="outline" size="sm">
            <Link href={`/reports?month=${next}`}>
              下個月 <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* 分店營收比較 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">分店營收比較</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.map((r) => (
            <div key={r.store.id}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{r.store.name}</span>
                <span>
                  {fmtMoney(r.revenue)}
                  <span className="text-muted-foreground ml-2 text-xs">
                    占比 {totalRevenue ? ((r.revenue / totalRevenue) * 100).toFixed(0) : 0}%
                  </span>
                </span>
              </div>
              <div className="flex h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${(r.serviceRevenue / maxRevenue) * 100}%` }}
                  title={`服務 ${fmtMoney(r.serviceRevenue)}`}
                />
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${(r.productRevenue / maxRevenue) * 100}%` }}
                  title={`產品 ${fmtMoney(r.productRevenue)}`}
                />
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            <span className="inline-block w-2 h-2 rounded-full bg-primary mr-1" />
            服務業績
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 ml-3 mr-1" />
            產品銷售
          </p>
        </CardContent>
      </Card>

      {/* 分店明細卡 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map((r) => {
          const catTotal = Object.values(r.byCategory).reduce((a, b) => a + b, 0) || 1;
          return (
            <Card key={r.store.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{r.store.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{r.store.address}・{r.staffCount} 位員工</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-muted/50 py-3">
                    <p className="text-xs text-muted-foreground">營收</p>
                    <p className="font-bold">{fmtMoney(r.revenue)}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 py-3">
                    <p className="text-xs text-muted-foreground">結帳筆數</p>
                    <p className="font-bold">{r.txCount}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 py-3">
                    <p className="text-xs text-muted-foreground">客單價</p>
                    <p className="font-bold">{fmtMoney(r.avgTicket)}</p>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    預約 {r.apptCount} 筆・完成 {r.completed}
                  </span>
                  <span className={r.noShow > 0 ? "text-destructive" : "text-muted-foreground"}>
                    未到 {r.noShow}
                  </span>
                </div>
                <div className="space-y-2">
                  {Object.entries(r.byCategory)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, amount]) => (
                      <div key={cat}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span>{SERVICE_CATEGORIES[cat] ?? cat}</span>
                          <span className="text-muted-foreground">
                            {((amount / catTotal) * 100).toFixed(0)}%・{fmtMoney(amount)}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary/70"
                            style={{ width: `${(amount / catTotal) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
