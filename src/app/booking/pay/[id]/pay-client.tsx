"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fmtMoney } from "@/lib/constants";

export function PayClient({
  appointmentId,
  paid,
  amount,
}: {
  appointmentId: string;
  paid: boolean;
  amount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // 示範用卡號欄位：僅前端顯示，不會送出或儲存
  const [card, setCard] = useState("4242 4242 4242 4242");
  const [exp, setExp] = useState("12/28");
  const [cvc, setCvc] = useState("123");

  if (paid) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600 mb-2" />
        <p className="font-bold text-emerald-700">付款完成，預約已確認！</p>
        <p className="text-sm text-emerald-700/80 mt-1">已發送 LINE 通知，期待您的光臨。</p>
      </div>
    );
  }

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    // 安全考量：卡號不經過我們的伺服器；正式環境由金流商付款頁/SDK 處理
    const res = await fetch(`/api/public/pay/${appointmentId}`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) router.refresh();
    else setError(data.error ?? "付款失敗，請重試");
  }

  return (
    <form onSubmit={pay} className="rounded-lg border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2 font-medium text-sm">
        <CreditCard className="h-4 w-4" /> 信用卡付款（示範）
      </div>
      <div className="space-y-1.5">
        <Label>卡號</Label>
        <Input value={card} onChange={(e) => setCard(e.target.value)} inputMode="numeric" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>有效期限</Label>
          <Input value={exp} onChange={(e) => setExp(e.target.value)} placeholder="MM/YY" />
        </div>
        <div className="space-y-1.5">
          <Label>安全碼</Label>
          <Input value={cvc} onChange={(e) => setCvc(e.target.value)} maxLength={4} />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
        {loading ? "處理中…" : `確認付款 ${fmtMoney(amount)}`}
      </Button>
    </form>
  );
}
