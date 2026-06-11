"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function RemindButton() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    const res = await fetch("/api/notifications/remind", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) {
      toast({
        title: `明日提醒發送完成`,
        description: `明日共 ${data.total} 筆已確認預約，本次新發送 ${data.sent} 則（已提醒過的不重複發送）`,
      });
      router.refresh();
    } else {
      toast({ title: data.error ?? "發送失敗", variant: "destructive" });
    }
  }

  return (
    <Button onClick={send} disabled={loading}>
      <BellRing className="h-4 w-4 mr-1" />
      {loading ? "發送中…" : "發送明日預約提醒"}
    </Button>
  );
}
