"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const HEADER_MAP: Record<string, string> = {
  姓名: "name", name: "name",
  電話: "phone", 手機: "phone", phone: "phone",
  email: "email", 信箱: "email",
  性別: "gender", gender: "gender",
  生日: "birthday", birthday: "birthday",
  標籤: "tags", tags: "tags",
  備註: "note", note: "note",
  儲值金: "balance", balance: "balance",
};

function parseCsv(text: string) {
  const clean = text.replace(/^﻿/, "").trim();
  const lines = clean.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { rows: [], error: "檔案需包含標題列與至少一筆資料" };

  const headers = lines[0].split(",").map((h) => HEADER_MAP[h.trim().toLowerCase()] ?? HEADER_MAP[h.trim()] ?? "");
  if (!headers.includes("name") || !headers.includes("phone")) {
    return { rows: [], error: "標題列必須包含「姓名」與「電話」欄位" };
  }

  const rows = lines.slice(1).map((line) => {
    const cols = line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((key, i) => {
      if (key) row[key] = (cols[i] ?? "").trim();
    });
    return row;
  });
  return { rows, error: null };
}

export function ImportDialog() {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [parseError, setParseError] = useState("");

  function downloadTemplate() {
    const csv = "﻿姓名,電話,Email,性別,生日,標籤,備註,儲值金\n王小美,0912-000-111,mei@example.com,女,1990-01-15,VIP,偏好自然色系,2000\n";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = "顧客匯入範本.csv";
    a.click();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError("");
    setPreview([]);
    const reader = new FileReader();
    reader.onload = () => {
      const { rows, error } = parseCsv(String(reader.result ?? ""));
      if (error) setParseError(error);
      else setPreview(rows);
    };
    reader.readAsText(file, "utf-8");
  }

  async function doImport() {
    setLoading(true);
    const res = await fetch("/api/customers/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: preview }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) {
      toast({
        title: "匯入完成",
        description: `新增 ${data.created} 筆，略過 ${data.skipped} 筆（電話重複或格式錯誤）`,
      });
      setOpen(false);
      setPreview([]);
      router.refresh();
    } else {
      toast({ title: data.error ?? "匯入失敗", variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setPreview([]); setParseError(""); } }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-1" /> 匯入顧客
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>從其他系統匯入顧客（CSV）</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
            <li>從原系統匯出顧客資料為 CSV / Excel（另存為 CSV）</li>
            <li>欄位對應範本格式（只有姓名與電話為必填）</li>
            <li>上傳後預覽確認，再按匯入；電話重複的會自動略過，不會蓋掉既有資料</li>
          </ol>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-3.5 w-3.5 mr-1" /> 下載範本 CSV
          </Button>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-sm text-muted-foreground hover:border-primary hover:text-primary">
            <FileSpreadsheet className="h-7 w-7" />
            點擊選擇 CSV 檔案
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
          </label>
          {parseError && <p className="text-sm text-destructive">{parseError}</p>}
          {preview.length > 0 && (
            <>
              <div className="max-h-44 overflow-y-auto rounded-md border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="px-2 py-1.5 text-left">姓名</th>
                      <th className="px-2 py-1.5 text-left">電話</th>
                      <th className="px-2 py-1.5 text-left">標籤</th>
                      <th className="px-2 py-1.5 text-left">備註</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {preview.slice(0, 50).map((r, i) => (
                      <tr key={i}>
                        <td className="px-2 py-1">{r.name}</td>
                        <td className="px-2 py-1 font-mono">{r.phone}</td>
                        <td className="px-2 py-1">{r.tags}</td>
                        <td className="px-2 py-1 truncate max-w-32">{r.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button className="w-full" onClick={doImport} disabled={loading}>
                {loading ? "匯入中…" : `確認匯入 ${preview.length} 筆`}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
