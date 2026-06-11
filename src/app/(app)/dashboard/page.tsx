import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getActiveStoreId } from "@/lib/store-context";
import { canAccess } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  fmtMoney,
  PAYMENT_METHODS,
  SERVICE_CATEGORIES,
  APPOINTMENT_STATUS,
} from "@/lib/constants";
import {
  CircleDollarSign,
  CalendarDays,
  Users,
  Clock,
  AlertTriangle,
} from "lucide-react";

const ymd = (d: Date) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};

export default async function DashboardPage() {
  const me = await getSession();
  if (!me) redirect("/login");
  if (!canAccess(me, "dashboard")) redirect("/clock");
  const storeId = await getActiveStoreId(me);
  const staffStore = storeId ? { storeId } : {};

  const now = new Date();
  const todayStr = ymd(now);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const start14 = new Date(startOfToday.getTime() - 13 * 86400000);

  const [
    todaySales,
    monthSales,
    todayAppointments,
    monthNewCustomers,
    todayClockIns,
    staffCount,
    recentSales,
    monthItems,
    lowStock,
  ] = await Promise.all([
    prisma.sale.aggregate({ _sum: { total: true }, _count: true, where: { createdAt: { gte: startOfToday }, cashier: staffStore } }),
    prisma.sale.aggregate({ _sum: { total: true }, _count: true, where: { createdAt: { gte: startOfMonth }, cashier: staffStore } }),
    prisma.appointment.findMany({
      where: { date: todayStr, staff: staffStore },
      include: { customer: true, staff: true, service: true },
      orderBy: { startAt: "asc" },
    }),
    prisma.customer.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.timeRecord.count({ where: { workDate: todayStr, staff: staffStore } }),
    prisma.staff.count({ where: { active: true, ...staffStore } }),
    prisma.sale.findMany({ where: { createdAt: { gte: start14 }, cashier: staffStore }, select: { total: true, createdAt: true, paymentMethod: true } }),
    prisma.saleItem.findMany({
      where: { sale: { createdAt: { gte: startOfMonth }, cashier: staffStore } },
      include: { staff: { select: { name: true } } },
    }),
    prisma.product.findMany({ where: { active: true } }),
  ]);

  // 今日上班人員：排班（非休假）＋ 打卡狀態
  const [todayShifts, todayRecords] = await Promise.all([
    prisma.shift.findMany({
      where: { workDate: todayStr, shiftType: { not: "OFF" }, staff: { active: true, ...staffStore } },
      include: { staff: { select: { id: true, name: true, title: true, color: true } } },
      orderBy: { startTime: "asc" },
    }),
    prisma.timeRecord.findMany({ where: { workDate: todayStr } }),
  ]);
  const onDuty = todayShifts.map((s) => {
    const rec = todayRecords.filter((r) => r.staffId === s.staffId).at(-1);
    return {
      ...s,
      status: !rec ? "NOT_IN" : rec.clockOut ? "DONE" : "WORKING",
    };
  });

  // 近 14 天營收趨勢
  const trend: { label: string; total: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(startOfToday.getTime() - i * 86400000);
    const dStr = ymd(d);
    const total = recentSales
      .filter((s) => ymd(s.createdAt) === dStr)
      .reduce((sum, s) => sum + s.total, 0);
    trend.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, total });
  }
  const trendMax = Math.max(...trend.map((t) => t.total), 1);

  // 本月付款方式占比
  const monthStart = startOfMonth.getTime();
  const payBreakdown: Record<string, number> = {};
  for (const s of recentSales) {
    if (s.createdAt.getTime() >= monthStart) {
      payBreakdown[s.paymentMethod] = (payBreakdown[s.paymentMethod] ?? 0) + s.total;
    }
  }
  const payTotal = Object.values(payBreakdown).reduce((a, b) => a + b, 0) || 1;

  // 本月員工業績排行 / 服務 vs 產品
  const staffPerf: Record<string, { service: number; product: number }> = {};
  for (const item of monthItems) {
    const entry = (staffPerf[item.staff.name] ??= { service: 0, product: 0 });
    if (item.itemType === "SERVICE") entry.service += item.subtotal;
    else entry.product += item.subtotal;
  }
  const ranking = Object.entries(staffPerf)
    .map(([name, v]) => ({ name, ...v, total: v.service + v.product }))
    .sort((a, b) => b.total - a.total);
  const rankMax = Math.max(...ranking.map((r) => r.total), 1);

  const lowStockItems = lowStock.filter((p) => p.stock <= p.lowStockAt);
  const pendingCount = todayAppointments.filter((a) => a.status === "PENDING").length;

  const statusColor: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-gray-100 text-gray-500",
    NO_SHOW: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">公司儀表板</h1>
        <p className="text-muted-foreground text-sm">
          {now.getFullYear()} 年 {now.getMonth() + 1} 月 {now.getDate()} 日・營運總覽
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<CircleDollarSign className="h-5 w-5 text-primary" />}
          label="今日營收"
          value={fmtMoney(todaySales._sum.total ?? 0)}
          sub={`${todaySales._count} 筆結帳`}
        />
        <StatCard
          icon={<CircleDollarSign className="h-5 w-5 text-emerald-600" />}
          label="本月營收"
          value={fmtMoney(monthSales._sum.total ?? 0)}
          sub={`${monthSales._count} 筆結帳`}
        />
        <StatCard
          icon={<CalendarDays className="h-5 w-5 text-blue-600" />}
          label="今日預約"
          value={`${todayAppointments.length} 筆`}
          sub={pendingCount > 0 ? `${pendingCount} 筆待確認` : "皆已確認"}
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-purple-600" />}
          label="今日出勤"
          value={`${todayClockIns} / ${staffCount} 人`}
          sub={`本月新客 ${monthNewCustomers} 位`}
        />
      </div>

      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">今日上班人員（{onDuty.length} 位排班）</CardTitle>
          <Link href="/schedule" className="text-sm text-primary hover:underline">
            排班表 →
          </Link>
        </CardHeader>
        <CardContent>
          {onDuty.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">今天沒有人排班</p>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {onDuty.map((s) => (
                <div key={s.id} className="flex items-center gap-2.5 rounded-lg border px-3 py-2">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: s.staff.color }}
                  >
                    {s.staff.name.slice(0, 1)}
                  </span>
                  <div className="text-sm leading-tight">
                    <p className="font-medium">{s.staff.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.startTime}-{s.endTime}
                    </p>
                  </div>
                  <span
                    className={`ml-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      s.status === "WORKING"
                        ? "bg-emerald-100 text-emerald-700"
                        : s.status === "DONE"
                          ? "bg-gray-100 text-gray-500"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {s.status === "WORKING" ? "上班中" : s.status === "DONE" ? "已下班" : "未打卡"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">近 14 天營收趨勢</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1.5 h-44">
              {trend.map((t) => (
                <div key={t.label} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-[11px] text-muted-foreground opacity-0 group-hover:opacity-100">
                    {t.total > 0 ? `$${(t.total / 1000).toFixed(1)}k` : "-"}
                  </span>
                  <div
                    className="w-full rounded-t bg-primary/80 group-hover:bg-primary transition-colors"
                    style={{ height: `${Math.max((t.total / trendMax) * 130, 2)}px` }}
                  />
                  <span className="text-[11px] text-muted-foreground">{t.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">本月付款方式占比</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(payBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([method, amount]) => (
                <div key={method}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{PAYMENT_METHODS[method] ?? method}</span>
                    <span className="text-muted-foreground">
                      {((amount / payTotal) * 100).toFixed(0)}%・{fmtMoney(amount)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(amount / payTotal) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            {Object.keys(payBreakdown).length === 0 && (
              <p className="text-sm text-muted-foreground">本月尚無結帳紀錄</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">今日預約</CardTitle>
            <Link href="/appointments" className="text-sm text-primary hover:underline">
              全部預約 →
            </Link>
          </CardHeader>
          <CardContent>
            {todayAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">今天沒有預約</p>
            ) : (
              <div className="divide-y">
                {todayAppointments.slice(0, 6).map((a) => (
                  <div key={a.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <span className="font-mono text-muted-foreground w-12">
                      {a.startAt.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false })}
                    </span>
                    <span className="font-medium w-20 truncate">{a.customer.name}</span>
                    <span className="flex-1 truncate text-muted-foreground">
                      {a.service.name}・{a.staff.name}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${statusColor[a.status]}`}>
                      {APPOINTMENT_STATUS[a.status]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">本月員工業績排行</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ranking.map((r, i) => (
              <div key={r.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span>
                    <span className="text-muted-foreground mr-1.5">#{i + 1}</span>
                    {r.name}
                  </span>
                  <span className="font-medium">{fmtMoney(r.total)}</span>
                </div>
                <div className="flex h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${(r.service / rankMax) * 100}%` }} />
                  <div className="h-full bg-emerald-500" style={{ width: `${(r.product / rankMax) * 100}%` }} />
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground pt-1">
              <span className="inline-block w-2 h-2 rounded-full bg-primary mr-1" />
              服務業績
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 ml-3 mr-1" />
              產品銷售
            </p>
          </CardContent>
        </Card>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50/50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
            <p className="text-sm">
              <span className="font-medium">低庫存警示：</span>
              {lowStockItems.map((p) => `${p.name}（剩 ${p.stock}）`).join("、")}
            </p>
            <Link href="/inventory" className="ml-auto text-sm text-primary hover:underline shrink-0">
              前往補貨 →
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          {icon}
          {label}
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}
