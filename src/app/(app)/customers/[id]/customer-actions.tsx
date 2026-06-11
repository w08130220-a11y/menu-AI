"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, TicketPlus, CheckCircle2, Trash2 } from "lucide-react";
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
import { fmtMoney } from "@/lib/constants";

export function TopupDialog({ customerId }: { customerId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/customers/${customerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ balanceDelta: Number(amount), note }),
    });
    setLoading(false);
    if (res.ok) {
      toast({ title: `儲值 NT$ ${Number(amount).toLocaleString()} 完成` });
      setOpen(false);
      setAmount("");
      setNote("");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast({ title: data.error ?? "儲值失敗", variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Wallet className="h-3.5 w-3.5 mr-1" /> 儲值
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>儲值金加值</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>金額（NT$）</Label>
            <Input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-2">
            {[1000, 3000, 5000, 10000].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmount(String(v))}
                className="flex-1 rounded-md border px-2 py-1.5 text-xs hover:bg-muted"
              >
                {v / 1000}k
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label>備註（選填）</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={100}
              placeholder="例：週年慶儲值活動"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !amount}>
            確認儲值
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type PassTemplate = {
  id: string;
  name: string;
  totalSessions: number;
  validDays: number;
  price: number;
};

export function AddPassDialog({
  customerId,
  templates,
}: {
  customerId: string;
  templates: PassTemplate[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState("");
  const [loading, setLoading] = useState(false);

  const selected = templates.find((t) => t.id === templateId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/passes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, templateId }),
    });
    setLoading(false);
    if (res.ok) {
      toast({ title: "療程券已開立" });
      setOpen(false);
      setTemplateId("");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast({ title: data.error ?? "開立失敗", variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <TicketPlus className="h-3.5 w-3.5 mr-1" /> 開立療程券
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>開立療程券</DialogTitle>
        </DialogHeader>
        {templates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            尚未建立療程券方案。請先到「服務項目」頁面的「療程券方案」區塊新增方案，新增後即可在此選擇開立。
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label>選擇方案</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                required
              >
                <option value="">請選擇療程券方案…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}（{t.totalSessions} 堂{t.price > 0 ? `・${fmtMoney(t.price)}` : ""}）
                  </option>
                ))}
              </select>
            </div>
            {selected && (
              <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
                <p>共 {selected.totalSessions} 堂・效期 {selected.validDays} 天</p>
                {selected.price > 0 && (
                  <p className="text-muted-foreground">
                    售價 {fmtMoney(selected.price)}（收款請另至 POS 結帳）
                  </p>
                )}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading || !templateId}>
              開立
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function UsePassButton({ passId, disabled }: { passId: string; disabled: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function use() {
    setLoading(true);
    const res = await fetch(`/api/passes/${passId}`, { method: "POST" });
    setLoading(false);
    if (res.ok) {
      toast({ title: "已核銷 1 堂" });
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast({ title: data.error ?? "核銷失敗", variant: "destructive" });
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={use} disabled={disabled || loading}>
      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> 核銷 1 堂
    </Button>
  );
}

export function DeleteBalanceTxButton({ txId }: { txId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function remove() {
    if (!confirm("確定刪除這筆儲值紀錄？餘額將同步沖銷。")) return;
    setLoading(true);
    const res = await fetch(`/api/balance-tx/${txId}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) {
      toast({ title: "紀錄已刪除，餘額已沖銷" });
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast({ title: data.error ?? "刪除失敗", variant: "destructive" });
    }
  }

  return (
    <button
      onClick={remove}
      disabled={loading}
      title="刪除並沖銷"
      className="rounded p-1 text-destructive hover:bg-destructive/10"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
