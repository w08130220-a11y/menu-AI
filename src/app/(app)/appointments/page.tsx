import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  APPOINTMENT_STATUS,
  APPOINTMENT_SOURCE,
  SERVICE_CATEGORIES,
} from "@/lib/constants";
import { StatusButtons, NewAppointmentDialog } from "./appointment-actions";
import { ChevronLeft, ChevronRight } from "lucide-react";

const toYmd = (d: Date) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};

function shiftDate(date: string, days: number) {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toYmd(d);
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const todayStr = toYmd(new Date());
  const date = params.date ?? todayStr;

  const [appointments, customers, staffList, services] = await Promise.all([
    prisma.appointment.findMany({
      where: { date },
      include: { customer: true, staff: true, service: true },
      orderBy: { startAt: "asc" },
    }),
    prisma.customer.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.staff.findMany({ where: { active: true }, select: { id: true, name: true } }),
    prisma.service.findMany({
      where: { active: true },
      select: { id: true, name: true, price: true, durationMin: true },
      orderBy: { category: "asc" },
    }),
  ]);

  const statusColor: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-gray-100 text-gray-500",
    NO_SHOW: "bg-red-100 text-red-700",
  };

  const weekday = "日一二三四五六"[new Date(`${date}T00:00:00`).getDay()];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">預約管理</h1>
          <p className="text-muted-foreground text-sm">
            {date}（{weekday}）・共 {appointments.length} 筆
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/appointments?date=${shiftDate(date, -1)}`}>
              <ChevronLeft className="h-4 w-4" /> 前一天
            </Link>
          </Button>
          {date !== todayStr && (
            <Button asChild variant="outline" size="sm">
              <Link href="/appointments">今天</Link>
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <Link href={`/appointments?date=${shiftDate(date, 1)}`}>
              後一天 <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
          <NewAppointmentDialog
            customers={customers}
            staffList={staffList}
            services={services}
            defaultDate={date}
          />
        </div>
      </div>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            這一天還沒有預約
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex flex-wrap items-center gap-4 py-4">
                <div className="text-center w-16 shrink-0">
                  <p className="text-lg font-bold font-mono">
                    {a.startAt.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false })}
                  </p>
                  <p className="text-xs text-muted-foreground">{a.service.durationMin} 分</p>
                </div>
                <div
                  className="w-1 self-stretch rounded-full shrink-0"
                  style={{ background: a.staff.color }}
                />
                <div className="flex-1 min-w-48">
                  <p className="font-medium">
                    <Link href={`/customers/${a.customerId}`} className="hover:text-primary">
                      {a.customer.name}
                    </Link>
                    <span className="ml-2 text-xs text-muted-foreground font-normal">
                      {a.customer.phone}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {SERVICE_CATEGORIES[a.service.category]}・{a.service.name}・{a.staff.name}
                    {a.note && <span className="text-amber-600">・備註：{a.note}</span>}
                  </p>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground shrink-0">
                  {APPOINTMENT_SOURCE[a.source]}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${statusColor[a.status]}`}>
                  {APPOINTMENT_STATUS[a.status]}
                </span>
                <StatusButtons id={a.id} status={a.status} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
