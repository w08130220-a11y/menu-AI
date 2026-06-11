import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession, isManager } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PunchButton } from "./punch-button";

const ymd = (d: Date) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};
const hm = (d: Date) =>
  d.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false });

function hoursBetween(a: Date, b: Date) {
  return ((b.getTime() - a.getTime()) / 3600000).toFixed(1);
}

export default async function ClockPage() {
  const staff = await getSession();
  if (!staff) redirect("/login");

  const todayStr = ymd(new Date());
  const weekAgo = ymd(new Date(Date.now() - 7 * 86400000));

  const [openRecord, myRecords, allToday] = await Promise.all([
    prisma.timeRecord.findFirst({ where: { staffId: staff.id, clockOut: null } }),
    prisma.timeRecord.findMany({
      where: { staffId: staff.id, workDate: { gte: weekAgo } },
      orderBy: { clockIn: "desc" },
    }),
    isManager(staff)
      ? prisma.timeRecord.findMany({
          where: { workDate: todayStr },
          include: { staff: { select: { name: true, title: true } } },
          orderBy: { clockIn: "asc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">上下班打卡</h1>
        <p className="text-muted-foreground text-sm">{staff.name}，記得上下班都要打卡喔</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <PunchButton working={!!openRecord} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">我的近 7 天紀錄</CardTitle>
          </CardHeader>
          <CardContent>
            {myRecords.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">近 7 天沒有打卡紀錄</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 font-medium">日期</th>
                    <th className="py-2 font-medium">上班</th>
                    <th className="py-2 font-medium">下班</th>
                    <th className="py-2 font-medium text-right">時數</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {myRecords.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2">{r.workDate.slice(5)}</td>
                      <td className="py-2 font-mono">{hm(r.clockIn)}</td>
                      <td className="py-2 font-mono">
                        {r.clockOut ? hm(r.clockOut) : <span className="text-emerald-600">上班中</span>}
                      </td>
                      <td className="py-2 text-right font-mono">
                        {r.clockOut ? `${hoursBetween(r.clockIn, r.clockOut)}h` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {isManager(staff) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">今日全店出勤（管理者）</CardTitle>
          </CardHeader>
          <CardContent>
            {allToday.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">今天還沒有人打卡</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 font-medium">員工</th>
                    <th className="py-2 font-medium">職稱</th>
                    <th className="py-2 font-medium">上班</th>
                    <th className="py-2 font-medium">下班</th>
                    <th className="py-2 font-medium text-right">時數</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {allToday.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2 font-medium">{r.staff.name}</td>
                      <td className="py-2 text-muted-foreground">{r.staff.title}</td>
                      <td className="py-2 font-mono">{hm(r.clockIn)}</td>
                      <td className="py-2 font-mono">
                        {r.clockOut ? hm(r.clockOut) : <span className="text-emerald-600">上班中</span>}
                      </td>
                      <td className="py-2 text-right font-mono">
                        {r.clockOut ? `${hoursBetween(r.clockIn, r.clockOut)}h` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
