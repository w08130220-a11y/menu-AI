"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SHIFT_TYPES } from "@/lib/constants";

const ORDER = ["FULL", "MORNING", "EVENING", "OFF"];
const STYLE: Record<string, string> = {
  FULL: "bg-primary/15 text-primary border-primary/30",
  MORNING: "bg-sky-100 text-sky-700 border-sky-200",
  EVENING: "bg-violet-100 text-violet-700 border-violet-200",
  OFF: "bg-muted text-muted-foreground border-transparent",
};

type StaffRow = { id: string; name: string; title: string | null; color: string };
type ShiftMap = Record<string, string>; // `${staffId}:${date}` -> shiftType

export function ScheduleGrid({
  staffList,
  shifts,
  weekDates,
  weekStart,
  canEdit,
  todayStr,
}: {
  staffList: StaffRow[];
  shifts: ShiftMap;
  weekDates: string[];
  weekStart: string;
  canEdit: boolean;
  todayStr: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  const prevWeek = shiftWeek(weekStart, -7);
  const nextWeek = shiftWeek(weekStart, 7);

  async function cycleShift(staffId: string, date: string) {
    if (!canEdit) return;
    const key = `${staffId}:${date}`;
    const current = shifts[key] ?? "OFF";
    const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
    setPending(key);
    await fetch("/api/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId, workDate: date, shiftType: next }),
    });
    setPending(null);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/schedule?week=${prevWeek}`}>
            <ChevronLeft className="h-4 w-4" /> 上週
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/schedule?week=${nextWeek}`}>
            下週 <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          {ORDER.map((t) => (
            <span key={t} className="flex items-center gap-1">
              <span className={`inline-block h-3 w-3 rounded border ${STYLE[t]}`} />
              {SHIFT_TYPES[t].label}
              {SHIFT_TYPES[t].start && ` ${SHIFT_TYPES[t].start}-${SHIFT_TYPES[t].end}`}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-3 py-2.5 text-left font-medium w-36">員工</th>
              {weekDates.map((d) => {
                const date = new Date(`${d}T00:00:00`);
                const isToday = d === todayStr;
                return (
                  <th
                    key={d}
                    className={`px-2 py-2.5 text-center font-medium ${isToday ? "text-primary" : ""}`}
                  >
                    {"日一二三四五六"[date.getDay()]}
                    <br />
                    <span className="text-xs font-normal text-muted-foreground">
                      {date.getMonth() + 1}/{date.getDate()}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y">
            {staffList.map((s) => (
              <tr key={s.id}>
                <td className="px-3 py-2">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                    <span>
                      <span className="font-medium">{s.name}</span>
                      <br />
                      <span className="text-xs text-muted-foreground">{s.title}</span>
                    </span>
                  </span>
                </td>
                {weekDates.map((d) => {
                  const key = `${s.id}:${d}`;
                  const type = shifts[key] ?? "OFF";
                  return (
                    <td key={d} className="px-1.5 py-1.5 text-center">
                      <button
                        onClick={() => cycleShift(s.id, d)}
                        disabled={!canEdit || pending === key}
                        className={`w-full rounded-md border px-1 py-2 text-xs font-medium transition-opacity ${STYLE[type]} ${
                          canEdit ? "hover:opacity-70 cursor-pointer" : "cursor-default"
                        } ${pending === key ? "opacity-40" : ""}`}
                      >
                        {SHIFT_TYPES[type].label}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {canEdit && (
        <p className="text-xs text-muted-foreground">
          點擊格子即可切換班別：全班 → 早班 → 晚班 → 休假
        </p>
      )}
    </div>
  );
}

function shiftWeek(weekStart: string, days: number) {
  const d = new Date(`${weekStart}T00:00:00`);
  d.setDate(d.getDate() + days);
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}
