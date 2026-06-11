"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Copy } from "lucide-react";
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

export function LineSettingsDialog({
  storeName,
  webhookUrl,
  configured,
  hasSecret,
}: {
  storeName: string;
  webhookUrl: string;
  configured: boolean;
  hasSecret: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const [secret, setSecret] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/store", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(token ? { lineChannelAccessToken: token } : {}),
        ...(secret ? { lineChannelSecret: secret } : {}),
      }),
    });
    setLoading(false);
    if (res.ok) {
      toast({ title: "LINE 串接設定已儲存" });
      setOpen(false);
      setToken("");
      setSecret("");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast({ title: data.error ?? "儲存失敗", variant: "destructive" });
    }
  }

  function copyUrl() {
    navigator.clipboard.writeText(webhookUrl);
    toast({ title: "Webhook 網址已複製" });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageCircle className="h-3.5 w-3.5 mr-1" />
          LINE 串接設定
          <span
            className={`ml-1.5 h-2 w-2 rounded-full ${configured ? "bg-emerald-500" : "bg-muted-foreground/40"}`}
          />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>LINE 官方帳號串接（{storeName}）</DialogTitle>
        </DialogHeader>
        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
          <li>申請 LINE 官方帳號，並於 LINE Developers 啟用 Messaging API</li>
          <li>將下方 Webhook 網址貼到 LINE Developers 的 Webhook URL 並啟用</li>
          <li>將 Channel Access Token 與 Channel Secret 貼到下方欄位儲存</li>
          <li>顧客加官方帳號好友後傳送手機號碼，即自動完成綁定</li>
        </ol>

        <div className="space-y-1.5">
          <Label>Webhook 網址（貼到 LINE Developers）</Label>
          <div className="flex gap-2">
            <Input readOnly value={webhookUrl} className="font-mono text-xs" />
            <Button type="button" variant="outline" size="sm" onClick={copyUrl} className="shrink-0">
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Channel Access Token {configured && "（已設定，留空表示不變更）"}</Label>
            <Input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={configured ? "••••••••（已設定）" : "貼上長效 Channel Access Token"}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Channel Secret {hasSecret && "（已設定，留空表示不變更）"}</Label>
            <Input
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder={hasSecret ? "••••••••（已設定）" : "貼上 Channel Secret"}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || (!token && !secret)}>
            儲存設定
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
