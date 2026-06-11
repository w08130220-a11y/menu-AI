import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { fmtMoney } from "@/lib/constants";
import { CustomerDialog } from "./customer-dialog";
import { ImportDialog } from "./import-dialog";
import { Search } from "lucide-react";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const customers = await prisma.customer.findMany({
    where: q
      ? { OR: [{ name: { contains: q } }, { phone: { contains: q } }, { tags: { contains: q } }] }
      : undefined,
    include: {
      _count: { select: { sales: true, appointments: true } },
      sales: { select: { total: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">顧客管理</h1>
          <p className="text-muted-foreground text-sm">共 {customers.length} 位顧客</p>
        </div>
        <div className="flex gap-2">
          <ImportDialog />
          <CustomerDialog />
        </div>
      </div>

      <form className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          name="q"
          defaultValue={q}
          placeholder="搜尋姓名 / 電話 / 標籤…"
          className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm"
        />
      </form>

      <Card>
        <CardContent className="pt-5 overflow-x-auto">
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-2.5 font-medium">顧客</th>
                <th className="py-2.5 font-medium">電話</th>
                <th className="py-2.5 font-medium">標籤</th>
                <th className="py-2.5 font-medium text-right">消費次數</th>
                <th className="py-2.5 font-medium text-right">累計消費</th>
                <th className="py-2.5 font-medium text-right">儲值金</th>
                <th className="py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customers.map((c) => {
                const totalSpent = c.sales.reduce((a, s) => a + s.total, 0);
                return (
                  <tr key={c.id} className="hover:bg-muted/40">
                    <td className="py-3 font-medium">
                      <Link href={`/customers/${c.id}`} className="hover:text-primary">
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-3 font-mono text-muted-foreground">{c.phone}</td>
                    <td className="py-3">
                      <span className="flex flex-wrap gap-1">
                        {(c.tags ?? "")
                          .split(",")
                          .filter(Boolean)
                          .map((t) => (
                            <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                              {t}
                            </span>
                          ))}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono">{c._count.sales}</td>
                    <td className="py-3 text-right font-mono">{fmtMoney(totalSpent)}</td>
                    <td className="py-3 text-right font-mono">
                      {c.balance > 0 ? (
                        <span className="text-emerald-600">{fmtMoney(c.balance)}</span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <Link href={`/customers/${c.id}`} className="text-sm text-primary hover:underline">
                        詳細 →
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    找不到符合的顧客
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
