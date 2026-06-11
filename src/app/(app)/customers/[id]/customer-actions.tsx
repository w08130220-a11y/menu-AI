"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, TicketPlus, CheckCircle2 } from "lucide-react";
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

export function TopupDialog({ customerId }: { customerId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/customers/${customerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ balanceDelta: Number(amount) }),
    });
    setLoading(false);
    if (res.ok) {
      toast({ title: `儲值 NT$ ${Number(amount).toLocaleString()} 完成` });
      setOpen(false);
      setAmount("");
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
          <Button type="submit" className="w-full" disabled={loading || !amount}>
            確認儲值
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddPassDialog({ customerId }: { customerId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [sessions, setSessions] = useState("10");
  const [days, setDays] = useState("180");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/passes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, name, totalSessions: sessions, expiresDays: days }),
    });
    setLoading(false);
    if (res.ok) {
      toast({ title: "療程券已新增" });
      setOpen(false);
      setName("");
      router.refresh();
    } else {
      toast({ title: "新增失敗", variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <TicketPlus className="h-3.5 w-3.5 mr-1" /> 新增療程券
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>新增療程券 / 堂數券</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>名稱（例：深層護膚 10 堂）</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>總堂數</Label>
              <Input type="number" min={1} value={sessions} onChange={(e) => setSessions(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>效期（天）</Label>
              <Input type="number" min={1} value={days} onChange={(e) => setDays(e.target.value)} />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            新增
          </Button>
        </form>
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
