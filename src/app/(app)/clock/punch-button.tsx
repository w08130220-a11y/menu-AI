"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function PunchButton({ working, clockMode }: { working: boolean; clockMode: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  function getPosition(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error("此瀏覽器不支援定位"));
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => reject(new Error("無法取得位置，請允許定位權限")),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  async function punch() {
    setLoading(true);
    try {
      let body = {};
      if (clockMode === "GPS") {
        body = await getPosition();
      }
      const res = await fetch("/api/clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast({
          title: data.action === "IN" ? "上班打卡成功" : "下班打卡成功",
          description: new Date().toLocaleTimeString("zh-TW", { hour12: false }),
        });
        router.refresh();
      } else {
        toast({ title: data.error ?? "打卡失敗，請重試", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "打卡失敗", variant: "destructive" });
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
        {loading ? "處理中…" : working ? "下班打卡" : "上班打卡"}
      </button>
      <p className="text-sm text-muted-foreground flex items-center gap-1">
        {clockMode === "GPS" && (
          <>
            <MapPin className="h-3.5 w-3.5" /> 需在店面範圍內打卡（GPS 驗證）
          </>
        )}
        {clockMode === "IP" && "需連接店內網路才能打卡"}
        {clockMode === "ANY" && (working ? "你目前為上班狀態" : "點擊開始今天的工作")}
      </p>
    </div>
  );
}
