import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  fmtMoney,
  APPOINTMENT_STATUS,
  PAYMENT_METHODS,
} from "@/lib/constants";
import { CustomerDialog } from "../customer-dialog";
import { TopupDialog, AddPassDialog, UsePassButton } from "./customer-actions";
import { PhotoSection } from "./photo-section";
import { ArrowLeft, Cake, Phone, Mail } from "lucide-react";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      passes: { orderBy: { createdAt: "desc" } },
      photos: { orderBy: { createdAt: "desc" } },
      sales: {
        include: { items: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      appointments: {
        include: { service: true, staff: true },
        orderBy: { startAt: "desc" },
        take: 10,
      },
    },
  });
  if (!customer) notFound();

  const totalSpent = customer.sales.reduce((a, s) => a + s.total, 0);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <Link href="/customers" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2">
          <ArrowLeft className="h-3.5 w-3.5" /> 回顧客列表
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {customer.name}
              {(customer.tags ?? "")
                .split(",")
                .filter(Boolean)
                .map((t) => (
                  <span key={t} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-normal">
                    {t}
                  </span>
                ))}
            </h1>
            <div className="mt-1 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> {customer.phone}
              </span>
              {customer.email && (
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> {customer.email}
                </span>
              )}
              {customer.birthday && (
                <span className="inline-flex items-center gap-1">
                  <Cake className="h-3.5 w-3.5" /> {customer.birthday}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <CustomerDialog customer={customer} />
            <TopupDialog customerId={customer.id} />
            <AddPassDialog customerId={customer.id} />
          </div>
        </div>
      </div>

      {customer.note && (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardContent className="py-3 text-sm">
            <span className="font-medium">注意事項：</span>
            {customer.note}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground mb-1">累計消費</p>
            <p className="text-2xl font-bold">{fmtMoney(totalSpent)}</p>
            <p className="text-xs text-muted-foreground mt-1">{customer.sales.length} 筆紀錄</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground mb-1">儲值金餘額</p>
            <p className="text-2xl font-bold text-emerald-600">{fmtMoney(customer.balance)}</p>
            <p className="text-xs text-muted-foreground mt-1">可於 POS 結帳折抵</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground mb-1">建檔日期</p>
            <p className="text-2xl font-bold">
              {customer.createdAt.toLocaleDateString("zh-TW", { month: "long", day: "numeric" })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{customer.createdAt.getFullYear()} 年</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">施作紀錄照片</CardTitle>
        </CardHeader>
        <CardContent>
          <PhotoSection
            customerId={customer.id}
            photos={customer.photos.map((p) => ({
              id: p.id,
              fileName: p.fileName,
              caption: p.caption,
              createdAt: p.createdAt.toISOString(),
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">療程券 / 堂數券</CardTitle>
        </CardHeader>
        <CardContent>
          {customer.passes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">尚無療程券</p>
          ) : (
            <div className="space-y-3">
              {customer.passes.map((p) => {
                const left = p.totalSessions - p.usedSessions;
                const expired = p.expiresAt ? p.expiresAt < new Date() : false;
                return (
                  <div key={p.id} className="flex items-center gap-4 rounded-lg border p-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        已用 {p.usedSessions} / {p.totalSessions} 堂
                        {p.expiresAt &&
                          `・效期至 ${p.expiresAt.toLocaleDateString("zh-TW")}`}
                        {expired && <span className="text-destructive">（已過期）</span>}
                      </p>
                      <div className="mt-1.5 h-1.5 w-full max-w-xs rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${(p.usedSessions / p.totalSessions) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${left > 0 && !expired ? "text-primary" : "text-muted-foreground"}`}>
                      剩 {left} 堂
                    </span>
                    <UsePassButton passId={p.id} disabled={left <= 0 || expired} />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">消費紀錄</CardTitle>
          </CardHeader>
          <CardContent>
            {customer.sales.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">尚無消費紀錄</p>
            ) : (
              <div className="divide-y">
                {customer.sales.map((s) => (
                  <div key={s.id} className="py-2.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {s.createdAt.toLocaleDateString("zh-TW")}・{PAYMENT_METHODS[s.paymentMethod]}
                      </span>
                      <span className="font-mono font-medium">{fmtMoney(s.total)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.items.map((i) => i.name).join("、")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">預約紀錄</CardTitle>
          </CardHeader>
          <CardContent>
            {customer.appointments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">尚無預約紀錄</p>
            ) : (
              <div className="divide-y">
                {customer.appointments.map((a) => (
                  <div key={a.id} className="py-2.5 text-sm flex justify-between gap-2">
                    <span>
                      <span className="text-muted-foreground mr-2">{a.date}</span>
                      {a.service.name}
                      <span className="text-muted-foreground">・{a.staff.name}</span>
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {APPOINTMENT_STATUS[a.status]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
