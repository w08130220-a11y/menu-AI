import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession, isManager } from "@/lib/session";
import { getActiveStoreId } from "@/lib/store-context";
import { canAccess } from "@/lib/permissions";
import { ScheduleGrid } from "./schedule-grid";

const toYmd = (d: Date) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const me = await getSession();
  if (!me) redirect("/login");
  if (!canAccess(me, "schedule")) redirect("/clock");
  const { week } = await searchParams;

  const base = week ? new Date(`${week}T00:00:00`) : new Date();
  const monday = new Date(base);
  monday.setDate(base.getDate() - ((base.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toYmd(d);
  });

  const storeId = await getActiveStoreId(me);
  const [staffList, shifts] = await Promise.all([
    prisma.staff.findMany({
      where: { active: true, ...(storeId ? { storeId } : {}) },
      select: { id: true, name: true, title: true, color: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.shift.findMany({
      where: { workDate: { in: weekDates } },
    }),
  ]);

  const shiftMap: Record<string, { shiftType: string; startTime: string; endTime: string }> = {};
  for (const s of shifts) {
    shiftMap[`${s.staffId}:${s.workDate}`] = {
      shiftType: s.shiftType,
      startTime: s.startTime,
      endTime: s.endTime,
    };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">員工排班</h1>
        <p className="text-muted-foreground text-sm">
          {weekDates[0]} ～ {weekDates[6]}
          {isManager(me) ? "・點擊格子調整班別" : "・檢視模式（排班由店長調整）"}
        </p>
      </div>
      <ScheduleGrid
        staffList={staffList}
        shifts={shiftMap}
        weekDates={weekDates}
        weekStart={weekDates[0]}
        canEdit={isManager(me)}
        todayStr={toYmd(new Date())}
      />
    </div>
  );
}
