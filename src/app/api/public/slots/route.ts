import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 查詢可預約時段（公開，免登入）
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const staffId = searchParams.get("staffId");
  const serviceId = searchParams.get("serviceId");
  if (!date || !staffId || !serviceId) {
    return NextResponse.json({ error: "參數不足" }, { status: 400 });
  }

  const [service, store, shift, appointments] = await Promise.all([
    prisma.service.findUnique({ where: { id: serviceId } }),
    prisma.store.findFirst(),
    prisma.shift.findUnique({ where: { staffId_workDate: { staffId, workDate: date } } }),
    prisma.appointment.findMany({
      where: { staffId, date, status: { in: ["PENDING", "CONFIRMED"] } },
      select: { startAt: true, endAt: true },
    }),
  ]);
  if (!service || !store) return NextResponse.json({ slots: [] });
  if (shift?.shiftType === "OFF") return NextResponse.json({ slots: [], reason: "當日休假" });

  const open = shift?.startTime || store.openTime;
  const close = shift?.endTime || store.closeTime;
  const toMin = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
  const openMin = toMin(open);
  const closeMin = toMin(close);
  const now = new Date();

  const slots: string[] = [];
  for (let m = openMin; m + service.durationMin <= closeMin; m += 30) {
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    const start = new Date(`${date}T${hh}:${mm}:00`);
    const end = new Date(start.getTime() + service.durationMin * 60000);
    if (start < now) continue;
    const conflict = appointments.some((a) => a.startAt < end && a.endAt > start);
    if (!conflict) slots.push(`${hh}:${mm}`);
  }
  return NextResponse.json({ slots });
}
