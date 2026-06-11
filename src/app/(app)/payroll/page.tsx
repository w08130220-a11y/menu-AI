import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession, isManager } from "@/lib/session";
import { getActiveStoreId } from "@/lib/store-context";
import { canAccess } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fmtMoney } from "@/lib/constants";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PayrollRulesDialog, LeaveDialog } from "./payroll-actions";

function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  return {
    start: new Date(y, m - 1, 1),
    end: new Date(y, m, 1),
    prev: `${m === 1 ? y - 1 : y}-${String(m === 1 ? 12 : m - 1).padStart(2, "0")}`,
    next: `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, "0")}`,
  };
}

const toMin = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const me = await getSession();
  if (!me) redirect("/login");
  if (!canAccess(me, "payroll")) redirect("/clock");
  const params = await searchParams;

  const now = new Date();
  const month = params.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const { start, end, prev, next } = monthRange(month);

  const storeId = await getActiveStoreId(me);
  const staffWhere = isManager(me)
    ? { active: true, ...(storeId ? { storeId } : {}) }
    : { id: me.id };

  const [staffList, items, timeRecords, shifts, leaves] = await Promise.all([
    prisma.staff.findMany({ where: staffWhere, include: { store: true }, orderBy: { createdAt: "asc" } }),
    prisma.saleItem.findMany({
      where: { sale: { createdAt: { gte: start, lt: end } } },
    }),
    prisma.timeRecord.findMany({
      where: { workDate: { startsWith: month } },
    }),
    prisma.shift.findMany({
      where: { workDate: { startsWith: month }, shiftType: { not: "OFF" } },
    }),
    prisma.leave.findMany({
      where: { workDate: { startsWith: month } },
      include: { staff: { select: { name: true } } },
      orderBy: { workDate: "asc" },
    }),
  ]);

  const shiftMap = new Map(shifts.map((s) => [`${s.staffId}:${s.workDate}`, s]));

  const rows = staffList.map((s) => {
    const rules = s.store;
    const mine = items.filter((i) => i.staffId === s.id);
    const serviceSales = mine.filter((i) => i.itemType === "SERVICE").reduce((a, i) => a + i.subtotal, 0);
    const productSales = mine.filter((i) => i.itemType === "PRODUCT").reduce((a, i) => a + i.subtotal, 0);
    const serviceCom = Math.round(serviceSales * s.serviceCommission);
    const productCom = Math.round(productSales * s.productCommission);

    const myRecords = timeRecords.filter((t) => t.staffId === s.id);
    const closed = myRecords.filter((t) => t.clockOut);
    const hours = closed.reduce((a, t) => a + (t.clockOut!.getTime() - t.clockIn.getTime()), 0) / 3600000;
    const basePay = s.payType === "HOURLY" ? Math.round(hours * s.hourlyRate) : s.baseSalary;

    // 遲到：打卡時間 vs 當日排班開始時間（超過寬限分鐘起算）
    let lateMinutes = 0;
    for (const t of myRecords) {
      const shift = shiftMap.get(`${s.id}:${t.workDate}`);
      if (!shift?.startTime) continue;
      const clockMin = t.clockIn.getHours() * 60 + t.clockIn.getMinutes();
      const lateBy = clockMin - toMin(shift.startTime) - rules.lateGraceMin;
      if (lateBy > 0) lateMinutes += lateBy;
    }
    const lateDeduct = s.payType === "MONTHLY" ? lateMinutes * rules.latePerMin : 0;

    // 事假不支薪、病假半薪（月薪制以 30 日計算日薪；時薪制缺勤本身即無薪）
    const myLeaves = leaves.filter((l) => l.staffId === s.id);
    const personalDays = myLeaves.filter((l) => l.leaveType === "PERSONAL").reduce((a, l) => a + l.days, 0);
    const sickDays = myLeaves.filter((l) => l.leaveType === "SICK").reduce((a, l) => a + l.days, 0);
    const dailyWage = s.baseSalary / 30;
    const personalDeduct = s.payType === "MONTHLY" ? Math.round(dailyWage * personalDays) : 0;
    const sickDeduct = s.payType === "MONTHLY" ? Math.round(dailyWage * 0.5 * sickDays) : 0;

    // 全勤：當月有出勤、無遲到、無請假
    const fullAttendance = myRecords.length > 0 && lateMinutes === 0 && myLeaves.length === 0;
    const bonus = fullAttendance ? rules.fullAttendanceBonus : 0;

    const total = basePay + serviceCom + productCom + bonus - lateDeduct - personalDeduct - sickDeduct;

    return {
      staff: s,
      hours,
      basePay,
      serviceSales,
      serviceCom,
      productSales,
      productCom,
      lateMinutes,
      lateDeduct,
      personalDays,
      personalDeduct,
      sickDays,
      sickDeduct,
      fullAttendance,
      bonus,
      total,
    };
  });

  const grandTotal = rows.reduce((a, r) => a + r.total, 0);
  const rules = staffList[0]?.store ?? { lateGraceMin: 5, latePerMin: 10, fullAttendanceBonus: 1000 };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">薪資計算</h1>
          <p className="text-muted-foreground text-sm">
            底薪/工時＋業績抽成＋全勤獎金－遲到/事假/病假扣款
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isManager(me) && (
            <>
              <LeaveDialog
                staffList={staffList.map((s) => ({ id: s.id, name: s.name }))}
                leaves={leaves.map((l) => ({
                  id: l.id,
                  workDate: l.workDate,
                  leaveType: l.leaveType,
                  days: l.days,
                  note: l.note,
                  staffName: l.staff.name,
                }))}
              />
              <PayrollRulesDialog rules={rules} />
            </>
          )}
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
          <table className="w-full text-sm min-w-[860px]">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-2.5 font-medium">員工</th>
                <th className="py-2.5 font-medium">薪資制度</th>
                <th className="py-2.5 font-medium text-right">底薪 / 工時薪資</th>
                <th className="py-2.5 font-medium text-right">服務抽成</th>
                <th className="py-2.5 font-medium text-right">產品抽成</th>
                <th className="py-2.5 font-medium text-right">出勤獎懲</th>
                <th className="py-2.5 font-medium text-right">當月薪資</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => {
                const attendanceNet = r.bonus - r.lateDeduct - r.personalDeduct - r.sickDeduct;
                return (
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
                    <td className="py-3 text-right font-mono">
                      {fmtMoney(r.serviceCom)}
                      <p className="text-xs text-muted-foreground">
                        {fmtMoney(r.serviceSales)}・{(r.staff.serviceCommission * 100).toFixed(0)}%
                      </p>
                    </td>
                    <td className="py-3 text-right font-mono">
                      {fmtMoney(r.productCom)}
                      <p className="text-xs text-muted-foreground">
                        {fmtMoney(r.productSales)}・{(r.staff.productCommission * 100).toFixed(0)}%
                      </p>
                    </td>
                    <td className="py-3 text-right font-mono">
                      <span className={attendanceNet > 0 ? "text-emerald-600" : attendanceNet < 0 ? "text-destructive" : ""}>
                        {attendanceNet >= 0 ? "+" : "-"}{fmtMoney(Math.abs(attendanceNet))}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {r.fullAttendance && "全勤 "}
                        {r.lateMinutes > 0 && `遲到 ${r.lateMinutes} 分 `}
                        {r.personalDays > 0 && `事假 ${r.personalDays} 天 `}
                        {r.sickDays > 0 && `病假 ${r.sickDays} 天`}
                        {!r.fullAttendance && r.lateMinutes === 0 && r.personalDays === 0 && r.sickDays === 0 && "—"}
                      </p>
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-primary">{fmtMoney(r.total)}</td>
                  </tr>
                );
              })}
            </tbody>
            {isManager(me) && (
              <tfoot>
                <tr className="border-t">
                  <td colSpan={6} className="py-3 text-right font-medium">
                    薪資總計
                  </td>
                  <td className="py-3 text-right font-mono font-bold">{fmtMoney(grandTotal)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground leading-relaxed">
        ※ 遲到以「打卡時間 vs 當日排班開始時間」計算，寬限 {rules.lateGraceMin} 分鐘，逾時每分鐘扣 NT$ {rules.latePerMin}（時薪制不另扣，缺勤時數本身即無薪）。<br />
        ※ 事假不支薪（日薪＝月薪 ÷ 30）、病假扣半薪；全勤（無遲到、無請假）加發 NT$ {rules.fullAttendanceBonus.toLocaleString()}。規則可由「薪資規則」調整。
      </p>
    </div>
  );
}
