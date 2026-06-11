import { notFound } from "next/navigation";
import { Sparkles, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { fmtMoney } from "@/lib/constants";
import { PayClient } from "./pay-client";

export const metadata = { title: "支付訂金" };
export const dynamic = "force-dynamic";

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      customer: { select: { name: true } },
      service: { select: { name: true } },
      staff: { select: { name: true }, },
    },
  });
  if (!appointment || appointment.depositStatus === "NONE") notFound();

  const paid = appointment.depositStatus === "PAID";

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-background">
      <header className="border-b bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-4 text-primary">
          <Sparkles className="h-6 w-6" />
          <span className="text-xl font-bold">BeauHub</span>
        </div>
      </header>
      <main className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-2xl font-bold text-center mb-2">
          {paid ? "訂金已付款" : "支付預約訂金"}
        </h1>
        <p className="text-center text-sm text-muted-foreground mb-8 flex items-center justify-center gap-1">
          <ShieldCheck className="h-4 w-4" /> 訂金可於到店結帳時全額折抵
        </p>

        <div className="rounded-lg border bg-card p-5 space-y-2 text-sm mb-6">
          <Row label="預約人" value={appointment.customer.name} />
          <Row label="服務" value={appointment.service.name} />
          <Row label="服務人員" value={appointment.staff.name} />
          <Row
            label="日期時間"
            value={`${appointment.date} ${appointment.startAt.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false })}`}
          />
          <div className="border-t pt-2 flex justify-between font-bold text-base">
            <span>訂金金額</span>
            <span className="text-primary">{fmtMoney(appointment.depositAmount)}</span>
          </div>
        </div>

        <PayClient appointmentId={appointment.id} paid={paid} amount={appointment.depositAmount} />

        <p className="mt-6 text-center text-xs text-muted-foreground">
          示範模式：未串接金流，不會實際扣款。
          <br />
          正式環境可串接綠界 ECPay／藍新 NewebPay／Stripe（介面已預留）。
        </p>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
