"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SHIFT_TYPES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

const PRESETS = ["FULL", "MORNING", "EVENING", "OFF"];
const STYLE: Record<string, string> = {
  FULL: "bg-primary/15 text-primary border-primary/30",
  MORNING: "bg-sky-100 text-sky-700 border-sky-200",
  EVENING: "bg-violet-100 text-violet-700 border-violet-200",
  CUSTOM: "bg-emerald-100 text-emerald-700 border-emerald-200",
  OFF: "bg-muted text-muted-foreground border-transparent",
};

type StaffRow = { id: string; name: string; title: string | null; color: string };
type ShiftCell = { shiftType: string; startTime: string; endTime: string };
type ShiftMap = Record<string, ShiftCell>; // `${staffId}:${date}`

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
  const { toast } = useToast();
  const [editing, setEditing] = useState<{ staff: StaffRow; date: string } | null>(null);
  const [custom, setCustom] = useState({ start: "11:00", end: "19:00" });
  const [loading, setLoading] = useState(false);

  const prevWeek = shiftWeek(weekStart, -7);
  const nextWeek = shiftWeek(weekStart, 7);

  async function save(shiftType: string, startTime?: string, endTime?: string) {
    if (!editing) return;
    setLoading(true);
    const res = await fetch("/api/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staffId: editing.staff.id,
        workDate: editing.date,
        shiftType,
        startTime,
        endTime,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setEditing(null);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast({ title: data.error ?? "儲存失敗", variant: "destructive" });
    }
  }

  function cellLabel(cell?: ShiftCell) {
    const type = cell?.shiftType ?? "OFF";
    if (type === "OFF") return <>休假</>;
    return (
      <>
        {type === "CUSTOM" ? "自訂" : SHIFT_TYPES[type].label}
        <br />
        <span className="font-normal opacity-80">
          {cell!.startTime}-{cell!.endTime}
        </span>
      </>
    );
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
          {["FULL", "MORNING", "EVENING", "CUSTOM", "OFF"].map((t) => (
            <span key={t} className="flex items-center gap-1">
              <span className={`inline-block h-3 w-3 rounded border ${STYLE[t]}`} />
              {SHIFT_TYPES[t].label}
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
                  const cell = shifts[`${s.id}:${d}`];
                  const type = cell?.shiftType ?? "OFF";
                  return (
                    <td key={d} className="px-1.5 py-1.5 text-center">
                      <button
                        onClick={() => {
                          if (!canEdit) return;
                          if (cell?.shiftType === "CUSTOM") {
                            setCustom({ start: cell.startTime, end: cell.endTime });
                          }
                          setEditing({ staff: s, date: d });
                        }}
                        disabled={!canEdit}
                        className={`w-full rounded-md border px-1 py-1.5 text-xs font-medium leading-tight transition-opacity ${STYLE[type]} ${
                          canEdit ? "hover:opacity-70 cursor-pointer" : "cursor-default"
                        }`}
                      >
                        {cellLabel(cell)}
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
          點擊格子選擇班別，或輸入自訂上下班時間
        </p>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>
              {editing?.staff.name}・{editing?.date.slice(5)} 排班
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((t) => (
              <button
                key={t}
                disabled={loading}
                onClick={() => save(t)}
                className={`rounded-md border px-2 py-2.5 text-sm font-medium hover:opacity-70 ${STYLE[t]}`}
              >
                {SHIFT_TYPES[t].label}
                {SHIFT_TYPES[t].start && (
                  <span className="block text-xs font-normal opacity-80">
                    {SHIFT_TYPES[t].start}-{SHIFT_TYPES[t].end}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="border-t pt-3 space-y-2">
            <Label className="text-sm">自訂時間</Label>
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={custom.start}
                onChange={(e) => setCustom((c) => ({ ...c, start: e.target.value }))}
              />
              <span className="text-muted-foreground">～</span>
              <Input
                type="time"
                value={custom.end}
                onChange={(e) => setCustom((c) => ({ ...c, end: e.target.value }))}
              />
            </div>
            <Button
              className="w-full"
              disabled={loading}
              onClick={() => save("CUSTOM", custom.start, custom.end)}
            >
              套用自訂班別
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function shiftWeek(weekStart: string, days: number) {
  const d = new Date(`${weekStart}T00:00:00`);
  d.setDate(d.getDate() + days);
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}
