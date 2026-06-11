"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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

type Option = { id: string; name: string };

export function StatusButtons({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function setStatus(next: string) {
    setLoading(true);
    const res = await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setLoading(false);
    if (res.ok) router.refresh();
    else toast({ title: "更新失敗", variant: "destructive" });
  }

  const actions: { label: string; next: string; cls: string }[] = [];
  if (status === "PENDING")
    actions.push({ label: "確認", next: "CONFIRMED", cls: "bg-blue-600 hover:bg-blue-700 text-white" });
  if (status === "PENDING" || status === "CONFIRMED") {
    actions.push({ label: "完成", next: "COMPLETED", cls: "bg-emerald-600 hover:bg-emerald-700 text-white" });
    actions.push({ label: "取消", next: "CANCELLED", cls: "border hover:bg-muted" });
  }
  if (status === "CONFIRMED")
    actions.push({ label: "未到", next: "NO_SHOW", cls: "border text-destructive hover:bg-destructive/10" });

  if (actions.length === 0) return null;
  return (
    <div className="flex gap-1.5">
      {actions.map((a) => (
        <button
          key={a.next}
          onClick={() => setStatus(a.next)}
          disabled={loading}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${a.cls}`}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}

export function NewAppointmentDialog({
  customers,
  staffList,
  services,
  defaultDate,
}: {
  customers: Option[];
  staffList: Option[];
  services: (Option & { price: number; durationMin: number })[];
  defaultDate: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customerId: "",
    staffId: "",
    serviceId: "",
    date: defaultDate,
    time: "14:00",
    note: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      toast({ title: "預約已建立" });
      setOpen(false);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast({ title: data.error ?? "建立失敗", variant: "destructive" });
    }
  }

  const sel =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-1" /> 新增預約
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新增預約（電話 / 現場）</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>顧客</Label>
            <select
              className={sel}
              value={form.customerId}
              onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}
              required
            >
              <option value="">選擇顧客…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">新顧客請先到「顧客管理」建檔</p>
          </div>
          <div className="space-y-1.5">
            <Label>服務項目</Label>
            <select
              className={sel}
              value={form.serviceId}
              onChange={(e) => setForm((f) => ({ ...f, serviceId: e.target.value }))}
              required
            >
              <option value="">選擇服務…</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}（NT$ {s.price.toLocaleString()}・{s.durationMin} 分）
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>服務人員</Label>
            <select
              className={sel}
              value={form.staffId}
              onChange={(e) => setForm((f) => ({ ...f, staffId: e.target.value }))}
              required
            >
              <option value="">選擇服務人員…</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>日期</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>時間</Label>
              <Input
                type="time"
                step={1800}
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>備註</Label>
            <Input
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="選填"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "建立中…" : "建立預約"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
