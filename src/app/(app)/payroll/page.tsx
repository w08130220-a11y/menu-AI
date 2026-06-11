import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession, isManager } from "@/lib/session";
import { getActiveStoreId } from "@/lib/store-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fmtMoney } from "@/lib/constants";
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

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const me = await getSession();
  if (!me) redirect("/login");
  const params = await searchParams;

  const now = new Date();
  const month = params.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const { start, end, prev, next } = monthRange(month);
  const monthPrefix = month; // workDate YYYY-MM-DD 以字串前綴篩選

  const storeId = await getActiveStoreId(me);
  const staffWhere = isManager(me)
    ? { active: true, ...(storeId ? { storeId } : {}) }
    : { id: me.id };

  const [staffList, items, timeRecords] = await Promise.all([
    prisma.staff.findMany({ where: staffWhere, orderBy: { createdAt: "asc" } }),
    prisma.saleItem.findMany({
      where: { sale: { createdAt: { gte: start, lt: end } } },
    }),
    prisma.timeRecord.findMany({
      where: { workDate: { startsWith: monthPrefix }, clockOut: { not: null } },
    }),
  ]);

  const rows = staffList.map((s) => {
    const mine = items.filter((i) => i.staffId === s.id);
    const serviceSales = mine.filter((i) => i.itemType === "SERVICE").reduce((a, i) => a + i.subtotal, 0);
    const productSales = mine.filter((i) => i.itemType === "PRODUCT").reduce((a, i) => a + i.subtotal, 0);
    const serviceCom = Math.round(serviceSales * s.serviceCommission);
    const productCom = Math.round(productSales * s.productCommission);
    const hours =
      timeRecords
        .filter((t) => t.staffId === s.id)
        .reduce((a, t) => a + (t.clockOut!.getTime() - t.clockIn.getTime()), 0) / 3600000;
    const basePay = s.payType === "HOURLY" ? Math.round(hours * s.hourlyRate) : s.baseSalary;
    return {
      staff: s,
      hours,
      basePay,
      serviceSales,
      serviceCom,
      productSales,
      productCom,
      total: basePay + serviceCom + productCom,
    };
  });

  const grandTotal = rows.reduce((a, r) => a + r.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">薪資計算</h1>
          <p className="text-muted-foreground text-sm">
            {month.replace("-", " 年 ")} 月・依底薪/打卡時數 + 業績抽成自動試算
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/payroll?month=${prev}`}>
              <ChevronLeft className="h-4 w-4" /> 上個月
            </Link>
          </Button>
          <span className="text-sm font-medium px-1">{month}</span>
          <Button asChild variant="outline" size="sm">
            <Link href={`/payroll?month=${next}`}>
              下個月 <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-5 overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-2.5 font-medium">員工</th>
                <th className="py-2.5 font-medium">薪資制度</th>
                <th className="py-2.5 font-medium text-right">底薪 / 工時薪資</th>
                <th className="py-2.5 font-medium text-right">服務業績</th>
                <th className="py-2.5 font-medium text-right">服務抽成</th>
                <th className="py-2.5 font-medium text-right">產品業績</th>
                <th className="py-2.5 font-medium text-right">產品抽成</th>
                <th className="py-2.5 font-medium text-right">當月薪資</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r.staff.id}>
                  <td className="py-3">
                    <p className="font-medium">{r.staff.name}</p>
                    <p className="text-xs text-muted-foreground">{r.staff.title}</p>
                  </td>
                  <td className="py-3">
                    {r.staff.payType === "HOURLY" ? (
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-700">
                        時薪 ${r.staff.hourlyRate}
                      </span>
                    ) : (
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">
                        月薪＋抽成
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right font-mono">
                    {fmtMoney(r.basePay)}
                    {r.staff.payType === "HOURLY" && (
                      <p className="text-xs text-muted-foreground">{r.hours.toFixed(1)} 小時</p>
                    )}
                  </td>
                  <td className="py-3 text-right font-mono text-muted-foreground">{fmtMoney(r.serviceSales)}</td>
                  <td className="py-3 text-right font-mono">
                    {fmtMoney(r.serviceCom)}
                    <p className="text-xs text-muted-foreground">{(r.staff.serviceCommission * 100).toFixed(0)}%</p>
                  </td>
                  <td className="py-3 text-right font-mono text-muted-foreground">{fmtMoney(r.productSales)}</td>
                  <td className="py-3 text-right font-mono">
                    {fmtMoney(r.productCom)}
                    <p className="text-xs text-muted-foreground">{(r.staff.productCommission * 100).toFixed(0)}%</p>
                  </td>
                  <td className="py-3 text-right font-mono font-bold text-primary">{fmtMoney(r.total)}</td>
                </tr>
              ))}
            </tbody>
            {isManager(me) && (
              <tfoot>
                <tr className="border-t">
                  <td colSpan={7} className="py-3 text-right font-medium">
                    全店薪資總計
                  </td>
                  <td className="py-3 text-right font-mono font-bold">{fmtMoney(grandTotal)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        ※ 時薪制以已完成上下班打卡的時數計算；抽成比例可於「員工管理」中為每位員工個別設定。
      </p>
    </div>
  );
}
