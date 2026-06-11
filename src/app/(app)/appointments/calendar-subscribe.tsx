"use client";

import { useState } from "react";
import { CalendarPlus, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export function CalendarSubscribe() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function load(regenerate = false) {
    setLoading(true);
    const res = await fetch("/api/calendar-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(regenerate ? { regenerate: true } : {}),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) {
      setUrl(`${location.origin}/api/calendar/${data.token}`);
      if (regenerate) toast({ title: "已重新產生連結，舊連結即刻失效" });
    } else {
      toast({ title: "取得連結失敗", variant: "destructive" });
    }
  }

  const webcal = url.replace(/^https?:\/\//, "webcal://");

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast({ title: "已複製" });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o && !url) load();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarPlus className="h-3.5 w-3.5 mr-1" /> 訂閱我的行事曆
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>把我的預約加到手機行事曆</DialogTitle>
        </DialogHeader>
        {!url ? (
          <p className="text-sm text-muted-foreground py-4">產生專屬連結中…</p>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="rounded-md border bg-muted/40 p-3 space-y-2">
              <p className="font-medium">iPhone（Apple 行事曆）</p>
              <ol className="list-decimal list-inside text-muted-foreground space-y-0.5">
                <li>
                  直接點下方「在 iPhone 開啟」，或到「設定 → 行事曆 → 帳號 →
                  加入帳號 → 其他 → 加入已訂閱的行事曆」貼上連結
                </li>
                <li>儲存後，你的預約就會自動出現在行事曆並同步更新</li>
                <li>預設每筆預約開始前 1 小時提醒（可在行事曆 App 調整）</li>
              </ol>
              <Button asChild size="sm" className="w-full">
                <a href={webcal}>在 iPhone / Mac 開啟訂閱</a>
              </Button>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">訂閱連結（Google 日曆也可用「透過網址新增」貼上）</p>
              <div className="flex gap-2">
                <Input readOnly value={url} className="font-mono text-xs" />
                <Button type="button" variant="outline" size="sm" onClick={() => copy(url)} className="shrink-0">
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-3">
              <p className="text-xs text-muted-foreground">
                連結外洩時可重新產生，舊連結立即失效
              </p>
              <Button variant="ghost" size="sm" onClick={() => load(true)} disabled={loading}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> 重新產生
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
