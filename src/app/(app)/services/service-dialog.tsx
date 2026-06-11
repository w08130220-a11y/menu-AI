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
import { SERVICE_CATEGORIES } from "@/lib/constants";

type ServiceInput = {
  id?: string;
  name: string;
  category: string;
  price: number | string;
  durationMin: number | string;
  depositAmount?: number | string;
  description?: string | null;
};

export function ServiceDialog({ service }: { service?: ServiceInput }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEdit = !!service?.id;
  const [form, setForm] = useState<ServiceInput>({
    name: service?.name ?? "",
    category: service?.category ?? "HAIR",
    price: service?.price ?? "",
    durationMin: service?.durationMin ?? 60,
    depositAmount: service?.depositAmount ?? 0,
    description: service?.description ?? "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(isEdit ? `/api/services/${service!.id}` : "/api/services", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      toast({ title: isEdit ? "服務已更新" : "服務已新增" });
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
        {isEdit ? (
          <Button variant="ghost" size="sm">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4 mr-1" /> 新增服務
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "編輯服務項目" : "新增服務項目"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>服務名稱 *</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="space-y-1.5">
            <Label>類別</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              {Object.entries(SERVICE_CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>價格（NT$）*</Label>
              <Input type="number" min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>時長（分鐘）</Label>
              <Input type="number" min={15} step={15} value={form.durationMin} onChange={(e) => setForm((f) => ({ ...f, durationMin: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>線上預約訂金（NT$，0 = 免訂金）</Label>
            <Input
              type="number"
              min={0}
              value={form.depositAmount}
              onChange={(e) => setForm((f) => ({ ...f, depositAmount: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>說明（顯示於線上預約）</Label>
            <Input value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            儲存
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ToggleActiveButton({
  id,
  active,
  endpoint,
}: {
  id: string;
  active: boolean;
  endpoint: "services" | "products";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    await fetch(`/api/${endpoint}/${id}`, {
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
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
        active ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-muted text-muted-foreground hover:bg-muted/70"
      }`}
    >
      {active ? "上架中" : "已下架"}
    </button>
  );
}
