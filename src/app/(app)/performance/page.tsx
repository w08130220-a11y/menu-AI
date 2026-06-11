import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession, isManager } from "@/lib/session";
import { getActiveStoreId } from "@/lib/store-context";
import { canAccess } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fmtMoney } from "@/lib/constants";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  return {
    start: new Date(y, m - 1, 1),
    end: new Date(y, m, 1),
    prev: `${m === 1 ? y - 1 : y}-${String(m === 1 ? 12 : m - 1).padStart(2, "0")}`,
    next: `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, "0")}`,
  };
}

export default async function PerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; staff?: string }>;
}) {
  const me = await getSession();
  if (!me) redirect("/login");
  if (!canAccess(me, "performance")) redirect("/clock");
  const params = await searchParams;

  const now = new Date();
  const month = params.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const { start, end, prev, next } = monthRange(month);

  const manager = isManager(me);
  const selectedStaffId = manager ? params.staff ?? "" : me.id;
  const storeId = await getActiveStoreId(me);
  const staffStore = storeId ? { storeId } : {};

  const [staffList, items] = await Promise.all([
    prisma.staff.findMany({
      where: { active: true, ...staffStore },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.saleItem.findMany({
      where: {
        sale: { createdAt: { gte: start, lt: end } },
        ...(selectedStaffId ? { staffId: selectedStaffId } : { staff: staffStore }),
      },
      include: {
        staff: { select: { name: true } },
        sale: { select: { createdAt: true, customer: { select: { name: true } } } },
      },
      orderBy: { sale: { createdAt: "desc" } },
    }),
  ]);

  const serviceTotal = items.filter((i) => i.itemType === "SERVICE").reduce((a, i) => a + i.subtotal, 0);
  const productTotal = items.filter((i) => i.itemType === "PRODUCT").reduce((a, i) => a + i.subtotal, 0);
  const productQty = items.filter((i) => i.itemType === "PRODUCT").reduce((a, i) => a + i.qty, 0);

  const query = (staffId: string) =>
    `/performance?month=${month}${staffId ? `&staff=${staffId}` : ""}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">業績紀錄</h1>
          <p className="text-muted-foreground text-sm">服務業績與產品販售明細</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/performance?month=${prev}${selectedStaffId ? `&staff=${selectedStaffId}` : ""}`}>
              <ChevronLeft className="h-4 w-4" /> 上個月
            </Link>
          </Button>
          <span className="text-sm font-medium px-1">{month}</span>
          <Button asChild variant="outline" size="sm">
            <Link href={`/performance?month=${next}${selectedStaffId ? `&staff=${selectedStaffId}` : ""}`}>
              下個月 <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {manager && (
        <div className="flex flex-wrap gap-2">
          <Link
            href={query("")}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm",
              !selectedStaffId ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
            )}
          >
            全部員工
          </Link>
          {staffList.map((s) => (
            <Link
              key={s.id}
              href={query(s.id)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm",
                selectedStaffId === s.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "hover:bg-muted"
              )}
            >
              {s.name}
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground mb-1">服務業績</p>
            <p className="text-2xl font-bold">{fmtMoney(serviceTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground mb-1">產品銷售額</p>
            <p className="text-2xl font-bold">{fmtMoney(productTotal)}</p>
            <p className="text-xs text-muted-foreground mt-1">共 {productQty} 件</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground mb-1">業績合計</p>
            <p className="text-2xl font-bold text-primary">{fmtMoney(serviceTotal + productTotal)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">明細（{items.length} 筆）</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">本月尚無紀錄</p>
          ) : (
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="py-2 font-medium">日期</th>
                  <th className="py-2 font-medium">類型</th>
                  <th className="py-2 font-medium">項目</th>
                  <th className="py-2 font-medium">顧客</th>
                  <th className="py-2 font-medium">業績歸屬</th>
                  <th className="py-2 font-medium text-right">數量</th>
                  <th className="py-2 font-medium text-right">金額</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((i) => (
                  <tr key={i.id}>
                    <td className="py-2.5 text-muted-foreground">
                      {i.sale.createdAt.toLocaleDateString("zh-TW", { month: "2-digit", day: "2-digit" })}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          i.itemType === "SERVICE"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {i.itemType === "SERVICE" ? "服務" : "產品"}
                      </span>
                    </td>
                    <td className="py-2.5 font-medium">{i.name}</td>
                    <td className="py-2.5 text-muted-foreground">{i.sale.customer?.name ?? "散客"}</td>
                    <td className="py-2.5">{i.staff.name}</td>
                    <td className="py-2.5 text-right font-mono">{i.qty}</td>
                    <td className="py-2.5 text-right font-mono">{fmtMoney(i.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
