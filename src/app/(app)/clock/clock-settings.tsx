"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings2, LocateFixed } from "lucide-react";
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
import { CLOCK_MODES } from "@/lib/constants";

export function ClockSettingsDialog({
  settings,
  currentIp,
}: {
  settings: {
    clockMode: string;
    allowedIps: string | null;
    latitude: number | null;
    longitude: number | null;
    radiusM: number;
  };
  currentIp: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    clockMode: settings.clockMode,
    allowedIps: settings.allowedIps ?? "",
    latitude: settings.latitude?.toString() ?? "",
    longitude: settings.longitude?.toString() ?? "",
    radiusM: String(settings.radiusM),
  });

  function useMyLocation() {
    if (!navigator.geolocation) {
      toast({ title: "此瀏覽器不支援定位", variant: "destructive" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setForm((f) => ({
          ...f,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        })),
      () => toast({ title: "無法取得位置，請允許定位權限", variant: "destructive" })
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/store", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      toast({ title: "打卡限制已更新" });
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
        <Button variant="outline" size="sm">
          <Settings2 className="h-3.5 w-3.5 mr-1" /> 打卡限制設定
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>打卡限制設定</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            {Object.entries(CLOCK_MODES).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setForm((f) => ({ ...f, clockMode: k }))}
                className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                  form.clockMode === k ? "border-primary bg-primary/10 text-primary font-medium" : ""
                }`}
              >
                {label}
                <span className="block text-xs font-normal text-muted-foreground">
                  {k === "ANY" && "任何地點皆可打卡"}
                  {k === "IP" && "僅允許清單內的網路 IP（店內 Wi-Fi 需固定 IP）"}
                  {k === "GPS" && "員工手機需在店面座標的允許半徑內"}
                </span>
              </button>
            ))}
          </div>

          {form.clockMode === "IP" && (
            <div className="space-y-1.5">
              <Label>允許的 IP（逗號分隔多組）</Label>
              <Input
                value={form.allowedIps}
                onChange={(e) => setForm((f) => ({ ...f, allowedIps: e.target.value }))}
                placeholder="例：203.0.113.45"
              />
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, allowedIps: f.allowedIps ? `${f.allowedIps},${currentIp}` : currentIp }))}
                className="text-xs text-primary hover:underline"
              >
                ＋加入目前網路 IP（{currentIp}）
              </button>
            </div>
          )}

          {form.clockMode === "GPS" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>緯度</Label>
                  <Input value={form.latitude} onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))} placeholder="25.041" />
                </div>
                <div className="space-y-1.5">
                  <Label>經度</Label>
                  <Input value={form.longitude} onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))} placeholder="121.554" />
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={useMyLocation} className="w-full">
                <LocateFixed className="h-3.5 w-3.5 mr-1" /> 使用我目前的位置（請在店內操作）
              </Button>
              <div className="space-y-1.5">
                <Label>允許半徑（公尺）</Label>
                <Input type="number" min={20} value={form.radiusM} onChange={(e) => setForm((f) => ({ ...f, radiusM: e.target.value }))} />
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            儲存設定
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
