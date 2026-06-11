"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type Photo = { id: string; fileName: string; caption: string | null; createdAt: string };

export function PhotoSection({ customerId, photos }: { customerId: string; photos: Photo[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [viewing, setViewing] = useState<Photo | null>(null);

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast({ title: "圖片大小上限 5MB", variant: "destructive" });
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  async function upload() {
    if (!file) return;
    setLoading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("caption", caption);
    const res = await fetch(`/api/customers/${customerId}/photos`, {
      method: "POST",
      body: form,
    });
    setLoading(false);
    if (res.ok) {
      toast({ title: "照片已上傳" });
      setFile(null);
      setPreviewUrl("");
      setCaption("");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast({ title: data.error ?? "上傳失敗", variant: "destructive" });
    }
  }

  async function remove(id: string) {
    await fetch(`/api/photos/${id}`, { method: "DELETE" });
    setViewing(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted">
          <Camera className="h-4 w-4" />
          選擇照片
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pick} />
        </label>
        {file && (
          <>
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="說明（例：2026/6 染霧感棕、敏感部位…）"
              maxLength={100}
              className="max-w-xs"
            />
            <Button size="sm" onClick={upload} disabled={loading}>
              {loading ? "上傳中…" : "上傳"}
            </Button>
          </>
        )}
      </div>
      {previewUrl && (
        <img src={previewUrl} alt="預覽" className="h-28 rounded-md border object-cover" />
      )}

      {photos.length === 0 ? (
        <p className="text-sm text-muted-foreground">尚無施作紀錄照片</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {photos.map((p) => (
            <button key={p.id} onClick={() => setViewing(p)} className="group text-left">
              <img
                src={`/api/uploads/${p.fileName}`}
                alt={p.caption ?? "施作紀錄"}
                className="aspect-square w-full rounded-md border object-cover group-hover:opacity-85"
              />
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {p.caption || new Date(p.createdAt).toLocaleDateString("zh-TW")}
              </p>
            </button>
          ))}
        </div>
      )}

      {viewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => setViewing(null)}
        >
          <div className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={`/api/uploads/${viewing.fileName}`}
              alt={viewing.caption ?? ""}
              className="w-full rounded-lg object-contain max-h-[70vh] bg-black"
            />
            <div className="mt-3 flex items-center gap-3 text-white">
              <p className="text-sm flex-1">
                {viewing.caption || "（無說明）"}・
                {new Date(viewing.createdAt).toLocaleDateString("zh-TW")}
              </p>
              <button
                onClick={() => remove(viewing.id)}
                className="rounded-md bg-white/10 p-2 hover:bg-destructive"
                title="刪除照片"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button onClick={() => setViewing(null)} className="rounded-md bg-white/10 p-2 hover:bg-white/20">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
