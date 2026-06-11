"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings2, CalendarMinus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LEAVE_TYPES } from "@/lib/constants";

export function PayrollRulesDialog({
  rules,
}: {
  rules: { lateGraceMin: number; latePerMin: number; fullAttendanceBonus: number };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    lateGraceMin: String(rules.lateGraceMin),
    latePerMin: String(rules.latePerMin),
    fullAttendanceBonus: String(rules.fullAttendanceBonus),
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/store", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      toast({ title: "薪資規則已更新" });
      setOpen(false);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast({ title: data.error ?? "儲存失敗", variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-3.5 w-3.5 mr-1" /> 薪資規則
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>薪資規則設定</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>遲到寬限（分鐘）</Label>
            <Input type="number" min={0} value={form.lateGraceMin}
              onChange={(e) => setForm((f) => ({ ...f, lateGraceMin: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>遲到扣款（NT$ / 分鐘）</Label>
            <Input type="number" min={0} value={form.latePerMin}
              onChange={(e) => setForm((f) => ({ ...f, latePerMin: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>全勤獎金（NT$ / 月）</Label>
            <Input type="number" min={0} value={form.fullAttendanceBonus}
              onChange={(e) => setForm((f) => ({ ...f, fullAttendanceBonus: e.target.value }))} />
            <p className="text-xs text-muted-foreground">當月無遲到且無請假即發放</p>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>儲存</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type LeaveRow = {
  id: string;
  workDate: string;
  leaveType: string;
  days: number;
  note: string | null;
  staffName: string;
};

export function LeaveDialog({
  staffList,
  leaves,
}: {
  staffList: { id: string; name: string }[];
  leaves: LeaveRow[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    staffId: "",
    workDate: new Date().toISOString().slice(0, 10),
    leaveType: "PERSONAL",
    days: "1",
    note: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/leaves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, days: Number(form.days) }),
    });
    setLoading(false);
    if (res.ok) {
      toast({ title: "請假已登記" });
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast({ title: data.error ?? "登記失敗", variant: "destructive" });
    }
  }

  async function remove(id: string) {
    await fetch(`/api/leaves/${id}`, { method: "DELETE" });
    router.refresh();
  }

  const sel =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarMinus className="h-3.5 w-3.5 mr-1" /> 請假登記
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>請假登記（事假 / 病假）</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>員工</Label>
              <select className={sel} value={form.staffId} required
                onChange={(e) => setForm((f) => ({ ...f, staffId: e.target.value }))}>
                <option value="">選擇員工…</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>日期</Label>
              <Input type="date" value={form.workDate} required
                onChange={(e) => setForm((f) => ({ ...f, workDate: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>假別</Label>
              <select className={sel} value={form.leaveType}
                onChange={(e) => setForm((f) => ({ ...f, leaveType: e.target.value }))}>
                {Object.entries(LEAVE_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>天數</Label>
              <select className={sel} value={form.days}
                onChange={(e) => setForm((f) => ({ ...f, days: e.target.value }))}>
                <option value="1">全天</option>
                <option value="0.5">半天</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>備註（選填）</Label>
            <Input value={form.note} maxLength={100}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>登記</Button>
        </form>

        {leaves.length > 0 && (
          <div className="border-t pt-3 space-y-1.5">
            <p className="text-sm font-medium">本月請假紀錄</p>
            {leaves.map((l) => (
              <div key={l.id} className="flex items-center gap-2 text-sm py-1">
                <span className="text-muted-foreground">{l.workDate.slice(5)}</span>
                <span className="font-medium">{l.staffName}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${
                  l.leaveType === "SICK" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {LEAVE_TYPES[l.leaveType]}{l.days === 0.5 ? "・半天" : ""}
                </span>
                {l.note && <span className="text-xs text-muted-foreground truncate">{l.note}</span>}
                <button onClick={() => remove(l.id)}
                  className="ml-auto rounded p-1 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
