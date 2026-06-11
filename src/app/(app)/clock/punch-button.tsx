"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function PunchButton({ working }: { working: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  async function punch() {
    setLoading(true);
    const res = await fetch("/api/clock", { method: "POST" });
    if (res.ok) {
      const { action } = await res.json();
      toast({
        title: action === "IN" ? "上班打卡成功" : "下班打卡成功",
        description: new Date().toLocaleTimeString("zh-TW", { hour12: false }),
      });
      router.refresh();
    } else {
      toast({ title: "打卡失敗，請重試", variant: "destructive" });
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <p className="text-4xl font-bold font-mono tabular-nums">
        {now ? now.toLocaleTimeString("zh-TW", { hour12: false }) : "--:--:--"}
      </p>
      <p className="text-muted-foreground text-sm">
        {now?.toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
      </p>
      <button
        onClick={punch}
        disabled={loading}
        className={`flex h-36 w-36 flex-col items-center justify-center gap-2 rounded-full text-lg font-bold text-white shadow-lg transition-transform hover:scale-105 disabled:opacity-60 ${
          working ? "bg-rose-500 hover:bg-rose-600" : "bg-emerald-500 hover:bg-emerald-600"
        }`}
      >
        {working ? <LogOut className="h-8 w-8" /> : <LogIn className="h-8 w-8" />}
        {working ? "下班打卡" : "上班打卡"}
      </button>
      <p className="text-sm text-muted-foreground">
        {working ? "你目前為上班狀態" : "點擊開始今天的工作"}
      </p>
    </div>
  );
}
