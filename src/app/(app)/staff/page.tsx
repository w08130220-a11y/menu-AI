import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession, isManager } from "@/lib/session";
import { getActiveStoreId } from "@/lib/store-context";
import { Card, CardContent } from "@/components/ui/card";
import { ROLES } from "@/lib/constants";
import { StaffDialog, ToggleStaffActive } from "./staff-dialog";

export default async function StaffPage() {
  const me = await getSession();
  if (!me) redirect("/login");
  if (!isManager(me)) redirect("/dashboard");

  const storeId = await getActiveStoreId(me);
  const staffList = await prisma.staff.findMany({
    where: storeId ? { storeId } : {},
    include: { store: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">員工管理</h1>
          <p className="text-muted-foreground text-sm">帳號、角色與薪資制度設定</p>
        </div>
        <StaffDialog canSetPermissions={me.role === "ADMIN"} />
      </div>

      <Card>
        <CardContent className="pt-5 overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-2.5 font-medium">員工</th>
                <th className="py-2.5 font-medium">帳號</th>
                <th className="py-2.5 font-medium">角色</th>
                <th className="py-2.5 font-medium">薪資制度</th>
                <th className="py-2.5 font-medium text-right">服務抽成</th>
                <th className="py-2.5 font-medium text-right">產品抽成</th>
                <th className="py-2.5 font-medium">狀態</th>
                <th className="py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {staffList.map((s) => (
                <tr key={s.id}>
                  <td className="py-3">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                      <span>
                        <span className="font-medium">{s.name}</span>
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {s.title}・{s.store.name}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className="py-3 text-muted-foreground">{s.email}</td>
                  <td className="py-3">{ROLES[s.role]}</td>
                  <td className="py-3">
                    {s.payType === "HOURLY"
                      ? `時薪 $${s.hourlyRate}`
                      : `月薪 $${s.baseSalary.toLocaleString()}`}
                  </td>
                  <td className="py-3 text-right font-mono">{(s.serviceCommission * 100).toFixed(0)}%</td>
                  <td className="py-3 text-right font-mono">{(s.productCommission * 100).toFixed(0)}%</td>
                  <td className="py-3">
                    {s.role === "ADMIN" ? (
                      <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs text-orange-700">管理者</span>
                    ) : (
                      <ToggleStaffActive id={s.id} active={s.active} />
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <StaffDialog staff={s} canSetPermissions={me.role === "ADMIN"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
