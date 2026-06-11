"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { SERVICE_CATEGORIES, PAYMENT_METHODS, fmtMoney } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Service = { id: string; name: string; category: string; price: number; durationMin: number };
type Product = { id: string; name: string; price: number; stock: number };
type StaffOpt = { id: string; name: string };
type CustomerOpt = { id: string; name: string; phone: string; balance: number };

type CartLine = {
  key: string;
  itemType: "SERVICE" | "PRODUCT";
  refId: string;
  name: string;
  price: number;
  qty: number;
  staffId: string;
};

export function PosClient({
  services,
  products,
  staffList,
  customers,
  meId,
}: {
  services: Service[];
  products: Product[];
  staffList: StaffOpt[];
  customers: CustomerOpt[];
  meId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const categories = [...new Set(services.map((s) => s.category))];
  const [tab, setTab] = useState<string>(categories[0] ?? "PRODUCT");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [discount, setDiscount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [loading, setLoading] = useState(false);

  const customer = customers.find((c) => c.id === customerId);
  const subtotal = cart.reduce((a, l) => a + l.price * l.qty, 0);
  const disc = Math.min(Number(discount) || 0, subtotal);
  const total = subtotal - disc;

  const visibleServices = useMemo(
    () => services.filter((s) => s.category === tab),
    [services, tab]
  );

  function add(itemType: "SERVICE" | "PRODUCT", refId: string, name: string, price: number) {
    setCart((prev) => {
      const found = prev.find((l) => l.refId === refId && l.itemType === itemType);
      if (found) {
        return prev.map((l) => (l === found ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...prev, { key: `${itemType}-${refId}-${Date.now()}`, itemType, refId, name, price, qty: 1, staffId: meId }];
    });
  }

  function setQty(key: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0)
    );
  }

  async function checkout() {
    setLoading(true);
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: customerId || null,
        discount: disc,
        paymentMethod,
        items: cart.map((l) => ({
          itemType: l.itemType,
          refId: l.refId,
          qty: l.qty,
          staffId: l.staffId,
        })),
      }),
    });
    setLoading(false);
    if (res.ok) {
      toast({
        title: "結帳完成",
        description: `${PAYMENT_METHODS[paymentMethod]}收款 ${fmtMoney(total)}`,
      });
      setCart([]);
      setDiscount("");
      setCustomerId("");
      setPaymentMethod("CASH");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast({ title: data.error ?? "結帳失敗", variant: "destructive" });
    }
  }

  const sel =
    "flex h-9 w-full rounded-md border border-input bg-background px-2.5 py-1 text-sm";

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      {/* 左側：項目選擇 */}
      <div className="lg:col-span-3 space-y-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setTab(c)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium",
                tab === c ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
              )}
            >
              {SERVICE_CATEGORIES[c]}
            </button>
          ))}
          <button
            onClick={() => setTab("PRODUCT")}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium",
              tab === "PRODUCT" ? "bg-emerald-600 text-white border-emerald-600" : "hover:bg-muted"
            )}
          >
            販售產品
          </button>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {tab !== "PRODUCT"
            ? visibleServices.map((s) => (
                <button
                  key={s.id}
                  onClick={() => add("SERVICE", s.id, s.name, s.price)}
                  className="rounded-lg border bg-card p-3.5 text-left hover:border-primary hover:shadow-sm transition-all"
                >
                  <p className="font-medium text-sm">{s.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.durationMin} 分鐘</p>
                  <p className="text-primary font-bold mt-1.5">{fmtMoney(s.price)}</p>
                </button>
              ))
            : products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => add("PRODUCT", p.id, p.name, p.price)}
                  disabled={p.stock <= 0}
                  className="rounded-lg border bg-card p-3.5 text-left hover:border-emerald-500 hover:shadow-sm transition-all disabled:opacity-50"
                >
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    庫存 {p.stock} {p.stock <= 0 && "（缺貨）"}
                  </p>
                  <p className="text-emerald-600 font-bold mt-1.5">{fmtMoney(p.price)}</p>
                </button>
              ))}
        </div>
      </div>

      {/* 右側：購物車與結帳 */}
      <div className="lg:col-span-2">
        <Card className="sticky top-4">
          <CardContent className="pt-5 space-y-4">
            <div className="flex items-center gap-2 font-medium">
              <ShoppingCart className="h-4 w-4" />
              結帳清單（{cart.reduce((a, l) => a + l.qty, 0)} 件）
            </div>

            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                點選左側項目加入結帳
              </p>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {cart.map((l) => (
                  <div key={l.key} className="rounded-md border p-2.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium flex-1 min-w-0 truncate">{l.name}</p>
                      <p className="text-sm font-mono">{fmtMoney(l.price * l.qty)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-xs"
                        value={l.staffId}
                        onChange={(e) =>
                          setCart((prev) =>
                            prev.map((x) => (x.key === l.key ? { ...x, staffId: e.target.value } : x))
                          )
                        }
                        title="業績歸屬"
                      >
                        {staffList.map((s) => (
                          <option key={s.id} value={s.id}>業績：{s.name}</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setQty(l.key, -1)} className="rounded border p-1 hover:bg-muted">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-mono">{l.qty}</span>
                        <button onClick={() => setQty(l.key, 1)} className="rounded border p-1 hover:bg-muted">
                          <Plus className="h-3 w-3" />
                        </button>
                        <button onClick={() => setQty(l.key, -l.qty)} className="rounded border p-1 hover:bg-destructive/10 text-destructive ml-1">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2.5 border-t pt-3">
              <select className={sel} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">散客（不記錄顧客）</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}（{c.phone}）{c.balance > 0 ? `儲值 $${c.balance.toLocaleString()}` : ""}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground shrink-0">折扣</span>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {Object.entries(PAYMENT_METHODS).map(([k, label]) => {
                  const disabled = k === "BALANCE" && (!customer || customer.balance < total);
                  return (
                    <button
                      key={k}
                      onClick={() => setPaymentMethod(k)}
                      disabled={disabled}
                      className={cn(
                        "rounded-md border px-1 py-2 text-xs font-medium disabled:opacity-40",
                        paymentMethod === k
                          ? "bg-primary text-primary-foreground border-primary"
                          : "hover:bg-muted"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {paymentMethod === "BALANCE" && customer && (
                <p className="text-xs text-muted-foreground">
                  {customer.name} 儲值餘額 {fmtMoney(customer.balance)}，結帳後剩 {fmtMoney(customer.balance - total)}
                </p>
              )}

              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>小計</span>
                  <span className="font-mono">{fmtMoney(subtotal)}</span>
                </div>
                {disc > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>折扣</span>
                    <span className="font-mono">-{fmtMoney(disc)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span>應收</span>
                  <span className="font-mono text-primary">{fmtMoney(total)}</span>
                </div>
              </div>

              <Button
                className="w-full h-11 text-base"
                disabled={cart.length === 0 || loading}
                onClick={checkout}
              >
                {loading ? "結帳中…" : `收款 ${fmtMoney(total)}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
