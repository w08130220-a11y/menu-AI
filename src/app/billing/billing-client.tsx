"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function SubscribeButton({
  plan,
  label,
  highlight,
}: {
  plan: "MONTHLY" | "YEARLY";
  label: string;
  highlight?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function subscribe() {
    setLoading(true);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) {
      if (data.url) {
        // Stripe Checkout 付款頁
        window.location.href = data.url;
        return;
      }
      toast({
        title: data.trial ? "已開始 7 天免費試用！" : "訂閱已開通",
        description: "示範模式（未串接金流，正式環境將導向 Stripe 付款頁）",
      });
      router.refresh();
    } else {
      toast({ title: data.error ?? "訂閱失敗", variant: "destructive" });
    }
  }

  return (
    <Button
      onClick={subscribe}
      disabled={loading}
      className="w-full h-11 text-base"
      variant={highlight ? "default" : "outline"}
    >
      {loading ? "處理中…" : label}
    </Button>
  );
}

export function CancelButton() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function cancel() {
    if (!confirm("確定取消訂閱？目前期間結束前仍可正常使用。")) return;
    setLoading(true);
    const res = await fetch("/api/billing/cancel", { method: "POST" });
    setLoading(false);
    if (res.ok) {
      toast({ title: "已排定期末取消", description: "期間結束前功能不受影響" });
      router.refresh();
    } else {
      toast({ title: "取消失敗", variant: "destructive" });
    }
  }

  return (
    <button
      onClick={cancel}
      disabled={loading}
      className="text-xs text-muted-foreground underline hover:text-destructive"
    >
      取消訂閱
    </button>
  );
}
