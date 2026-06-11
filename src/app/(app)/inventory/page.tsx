import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession, isManager } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { fmtMoney } from "@/lib/constants";
import { ProductDialog, RestockDialog } from "./product-dialog";
import { ToggleActiveButton } from "../services/service-dialog";
import { AlertTriangle } from "lucide-react";

export default async function InventoryPage() {
  const me = await getSession();
  if (!me) redirect("/login");
  if (!isManager(me)) redirect("/dashboard");

  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
  const lowCount = products.filter((p) => p.active && p.stock <= p.lowStockAt).length;
  const stockValue = products.reduce((a, p) => a + p.cost * p.stock, 0);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">產品庫存</h1>
          <p className="text-muted-foreground text-sm">
            共 {products.length} 項・庫存成本 {fmtMoney(stockValue)}
            {lowCount > 0 && <span className="text-yellow-600">・{lowCount} 項低庫存</span>}
          </p>
        </div>
        <ProductDialog />
      </div>

      <Card>
        <CardContent className="pt-5 overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-2.5 font-medium">產品</th>
                <th className="py-2.5 font-medium">分類</th>
                <th className="py-2.5 font-medium text-right">售價</th>
                <th className="py-2.5 font-medium text-right">成本</th>
                <th className="py-2.5 font-medium text-right">庫存</th>
                <th className="py-2.5 font-medium">狀態</th>
                <th className="py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="py-2.5 font-medium">
                    <span className="flex items-center gap-1.5">
                      {p.name}
                      {p.active && p.stock <= p.lowStockAt && (
                        <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                      )}
                    </span>
                  </td>
                  <td className="py-2.5 text-muted-foreground">{p.category}</td>
                  <td className="py-2.5 text-right font-mono">{fmtMoney(p.price)}</td>
                  <td className="py-2.5 text-right font-mono text-muted-foreground">{fmtMoney(p.cost)}</td>
                  <td className={`py-2.5 text-right font-mono font-bold ${p.stock <= p.lowStockAt ? "text-yellow-600" : ""}`}>
                    {p.stock}
                  </td>
                  <td className="py-2.5">
                    <ToggleActiveButton id={p.id} active={p.active} endpoint="products" />
                  </td>
                  <td className="py-2.5">
                    <div className="flex justify-end gap-1.5">
                      <RestockDialog productId={p.id} productName={p.name} />
                      <ProductDialog product={p} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
