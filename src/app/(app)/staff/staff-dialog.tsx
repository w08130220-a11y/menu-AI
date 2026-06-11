"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
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

type StaffInput = {
  id?: string;
  name: string;
  email?: string;
  role: string;
  title?: string | null;
  phone?: string | null;
  payType: string;
  baseSalary: number | string;
  hourlyRate: number | string;
  serviceCommission: number | string;
  productCommission: number | string;
  color: string;
};

export function StaffDialog({ staff }: { staff?: StaffInput }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEdit = !!staff?.id;
  const [form, setForm] = useState({
    name: staff?.name ?? "",
    email: staff?.email ?? "",
    password: "",
    role: staff?.role === "MANAGER" ? "MANAGER" : "STAFF",
    title: staff?.title ?? "",
    phone: staff?.phone ?? "",
    payType: staff?.payType ?? "MONTHLY",
    baseSalary: staff?.baseSalary ?? 28000,
    hourlyRate: staff?.hourlyRate ?? 200,
    serviceCommission: String(staff ? Number(staff.serviceCommission) * 100 : 10) as string | number,
    productCommission: String(staff ? Number(staff.productCommission) * 100 : 5) as string | number,
    color: staff?.color ?? "#f97316",
  });

  const isAdmin = staff?.role === "ADMIN";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const payload = {
      ...form,
      serviceCommission: Number(form.serviceCommission) / 100,
      productCommission: Number(form.productCommission) / 100,
      password: form.password || undefined,
    };
    const res = await fetch(isEdit ? `/api/staff/${staff!.id}` : "/api/staff", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (res.ok) {
      toast({ title: isEdit ? "員工資料已更新" : "員工已新增" });
      setOpen(false);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast({ title: data.error ?? "儲存失敗", variant: "destructive" });
    }
  }

  const sel =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="sm">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4 mr-1" /> 新增員工
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? `編輯員工：${staff!.name}` : "新增員工"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>姓名 *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>職稱</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="髮型設計師…" />
            </div>
          </div>
          {!isEdit && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Email（登入帳號）*</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>初始密碼 *</Label>
                <Input value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
              </div>
            </div>
          )}
          {isEdit && (
            <div className="space-y-1.5">
              <Label>重設密碼（留空表示不變更）</Label>
              <Input value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>角色</Label>
              <select
                className={sel}
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                disabled={isAdmin}
              >
                <option value="STAFF">員工</option>
                <option value="MANAGER">店長</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>顯示顏色</Label>
              <Input type="color" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} className="h-10 p-1" />
            </div>
          </div>

          <div className="rounded-md border p-3 space-y-3">
            <Label className="font-bold">薪資設定</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, payType: "MONTHLY" }))}
                className={`rounded-md border px-2 py-2 text-sm ${form.payType === "MONTHLY" ? "border-primary bg-primary/10 text-primary font-medium" : ""}`}
              >
                月薪＋抽成
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, payType: "HOURLY" }))}
                className={`rounded-md border px-2 py-2 text-sm ${form.payType === "HOURLY" ? "border-primary bg-primary/10 text-primary font-medium" : ""}`}
              >
                時薪制（依打卡）
              </button>
            </div>
            {form.payType === "MONTHLY" ? (
              <div className="space-y-1.5">
                <Label>月底薪（NT$）</Label>
                <Input type="number" min={0} value={form.baseSalary} onChange={(e) => setForm((f) => ({ ...f, baseSalary: e.target.value }))} />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>時薪（NT$）</Label>
                <Input type="number" min={0} value={form.hourlyRate} onChange={(e) => setForm((f) => ({ ...f, hourlyRate: e.target.value }))} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>服務抽成（%）</Label>
                <Input type="number" min={0} max={100} value={form.serviceCommission} onChange={(e) => setForm((f) => ({ ...f, serviceCommission: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>產品抽成（%）</Label>
                <Input type="number" min={0} max={100} value={form.productCommission} onChange={(e) => setForm((f) => ({ ...f, productCommission: e.target.value }))} />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            儲存
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ToggleStaffActive({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    await fetch(`/api/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
        active ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-muted text-muted-foreground hover:bg-muted/70"
      }`}
    >
      {active ? "在職" : "停用"}
    </button>
  );
}
