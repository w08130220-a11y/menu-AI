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

type TemplateInput = {
  id?: string;
  name: string;
  totalSessions: number | string;
  validDays: number | string;
  price: number | string;
};

export function PassTemplateDialog({ template }: { template?: TemplateInput }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEdit = !!template?.id;
  const [form, setForm] = useState<TemplateInput>({
    name: template?.name ?? "",
    totalSessions: template?.totalSessions ?? 10,
    validDays: template?.validDays ?? 180,
    price: template?.price ?? "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(
      isEdit ? `/api/pass-templates/${template!.id}` : "/api/pass-templates",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }
    );
    setLoading(false);
    if (res.ok) {
      toast({ title: isEdit ? "方案已更新" : "療程券方案已新增" });
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
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" /> 新增療程券方案
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "編輯療程券方案" : "新增療程券方案"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>方案名稱 *（例：深層護膚 10 堂）</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required maxLength={50} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>總堂數 *</Label>
              <Input type="number" min={1} value={form.totalSessions} onChange={(e) => setForm((f) => ({ ...f, totalSessions: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>效期（天）</Label>
              <Input type="number" min={1} value={form.validDays} onChange={(e) => setForm((f) => ({ ...f, validDays: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>售價（NT$，選填）</Label>
            <Input type="number" min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            儲存
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ToggleTemplateActive({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    await fetch(`/api/pass-templates/${id}`, {
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
      {active ? "販售中" : "已停用"}
    </button>
  );
}
