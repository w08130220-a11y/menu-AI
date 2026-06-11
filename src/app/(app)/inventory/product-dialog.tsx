"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, PackagePlus } from "lucide-react";
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

type ProductInput = {
  id?: string;
  name: string;
  category?: string | null;
  price: number | string;
  cost: number | string;
  stock?: number | string;
  lowStockAt: number | string;
};

export function ProductDialog({ product }: { product?: ProductInput }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEdit = !!product?.id;
  const [form, setForm] = useState<ProductInput>({
    name: product?.name ?? "",
    category: product?.category ?? "",
    price: product?.price ?? "",
    cost: product?.cost ?? "",
    stock: product?.stock ?? 0,
    lowStockAt: product?.lowStockAt ?? 5,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(isEdit ? `/api/products/${product!.id}` : "/api/products", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      toast({ title: isEdit ? "產品已更新" : "產品已新增" });
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
        {isEdit ? (
          <Button variant="ghost" size="sm">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4 mr-1" /> 新增產品
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "編輯產品" : "新增產品"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>產品名稱 *</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>分類</Label>
              <Input value={form.category ?? ""} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="美髮 / 保養…" />
            </div>
            <div className="space-y-1.5">
              <Label>售價（NT$）*</Label>
              <Input type="number" min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>成本（NT$）</Label>
              <Input type="number" min={0} value={form.cost} onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>低庫存警示</Label>
              <Input type="number" min={0} value={form.lowStockAt} onChange={(e) => setForm((f) => ({ ...f, lowStockAt: e.target.value }))} />
            </div>
          </div>
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>期初庫存</Label>
              <Input type="number" min={0} value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            儲存
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RestockDialog({ productId, productName }: { productId: string; productName: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stockDelta: Number(qty) }),
    });
    setLoading(false);
    if (res.ok) {
      toast({ title: `${productName} 庫存已調整 ${Number(qty) > 0 ? "+" : ""}${qty}` });
      setOpen(false);
      setQty("");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast({ title: data.error ?? "調整失敗", variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PackagePlus className="h-3.5 w-3.5 mr-1" /> 進貨
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>調整庫存：{productName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>數量（進貨填正數、盤損填負數）</Label>
            <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !qty}>
            確認調整
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
