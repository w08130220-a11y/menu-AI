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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type CustomerInput = {
  id?: string;
  name: string;
  phone: string;
  email?: string | null;
  gender?: string | null;
  birthday?: string | null;
  note?: string | null;
  tags?: string | null;
};

export function CustomerDialog({ customer }: { customer?: CustomerInput }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEdit = !!customer?.id;
  const [form, setForm] = useState<CustomerInput>({
    name: customer?.name ?? "",
    phone: customer?.phone ?? "",
    email: customer?.email ?? "",
    gender: customer?.gender ?? "",
    birthday: customer?.birthday ?? "",
    note: customer?.note ?? "",
    tags: customer?.tags ?? "",
  });

  const set = (k: keyof CustomerInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(isEdit ? `/api/customers/${customer!.id}` : "/api/customers", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      toast({ title: isEdit ? "顧客資料已更新" : "顧客建檔完成" });
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
          <Button variant="outline" size="sm">
            <Pencil className="h-3.5 w-3.5 mr-1" /> 編輯資料
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4 mr-1" /> 新增顧客
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "編輯顧客資料" : "新增顧客"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>姓名 *</Label>
              <Input value={form.name} onChange={set("name")} required />
            </div>
            <div className="space-y-1.5">
              <Label>電話 *</Label>
              <Input value={form.phone} onChange={set("phone")} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>性別</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.gender ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
              >
                <option value="">未填</option>
                <option value="F">女</option>
                <option value="M">男</option>
                <option value="OTHER">其他</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>生日</Label>
              <Input type="date" value={form.birthday ?? ""} onChange={set("birthday")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={form.email ?? ""} onChange={set("email")} />
          </div>
          <div className="space-y-1.5">
            <Label>標籤（逗號分隔，例：VIP,染燙客）</Label>
            <Input value={form.tags ?? ""} onChange={set("tags")} />
          </div>
          <div className="space-y-1.5">
            <Label>備註（過敏、偏好、注意事項）</Label>
            <Textarea rows={3} value={form.note ?? ""} onChange={set("note")} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "儲存中…" : "儲存"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
