"use client";

import { useEffect, useState } from "react";
import { Check, ChevronLeft, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SERVICE_CATEGORIES, fmtMoney } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Service = {
  id: string;
  name: string;
  category: string;
  price: number;
  durationMin: number;
  description: string | null;
};
type Staff = { id: string; name: string; title: string | null; color: string };

const STEPS = ["選擇服務", "選擇人員", "選擇時間", "填寫資料"];

export function BookingClient({
  services,
  staffList,
  storeName,
}: {
  services: Service[];
  staffList: Staff[];
  storeName: string;
}) {
  const [step, setStep] = useState(0);
  const [service, setService] = useState<Service | null>(null);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<string[] | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ date: string; time: string; serviceName: string; staffName: string } | null>(null);

  const categories = [...new Set(services.map((s) => s.category))];
  const [cat, setCat] = useState(categories[0] ?? "HAIR");

  // 未來 14 天
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return {
      value: z.toISOString().slice(0, 10),
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      weekday: "日一二三四五六"[d.getDay()],
      isToday: i === 0,
    };
  });

  useEffect(() => {
    if (!service || !staff || !date) return;
    setSlots(null);
    setTime("");
    fetch(`/api/public/slots?date=${date}&staffId=${staff.id}&serviceId=${service.id}`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .catch(() => setSlots([]));
  }, [service, staff, date]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/public/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: service!.id,
        staffId: staff!.id,
        date,
        time,
        name,
        phone,
        note,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) setDone(data);
    else setError(data.error ?? "預約失敗，請重試");
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md text-center py-10">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CalendarCheck className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">預約申請已送出！</h2>
        <p className="text-muted-foreground mb-6">
          門市確認後預約即生效，若有變動將以電話聯繫您。
        </p>
        <div className="rounded-lg border bg-card p-5 text-left space-y-2 text-sm">
          <Row label="店家" value={storeName} />
          <Row label="服務" value={done.serviceName} />
          <Row label="服務人員" value={done.staffName} />
          <Row label="日期時間" value={`${done.date} ${done.time}`} />
          <Row label="預約人" value={`${name}（${phone}）`} />
        </div>
        <Button className="mt-6" onClick={() => location.reload()}>
          再預約一筆
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* 步驟指示 */}
      <div className="mb-8 flex items-center justify-center gap-1.5 sm:gap-3">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-1.5 sm:gap-3">
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                  i < step
                    ? "bg-emerald-500 text-white"
                    : i === step
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className={cn("text-xs sm:text-sm", i === step ? "font-bold" : "text-muted-foreground")}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && <span className="h-px w-4 sm:w-8 bg-border" />}
          </div>
        ))}
      </div>

      {step > 0 && (
        <button
          onClick={() => setStep((s) => s - 1)}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> 上一步
        </button>
      )}

      {/* Step 1: 服務 */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium",
                  cat === c ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                )}
              >
                {SERVICE_CATEGORIES[c]}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {services
              .filter((s) => s.category === cat)
              .map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setService(s);
                    setStep(1);
                  }}
                  className="rounded-xl border bg-card p-4 text-left hover:border-primary hover:shadow-md transition-all"
                >
                  <p className="font-bold">{s.name}</p>
                  {s.description && (
                    <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">約 {s.durationMin} 分鐘</span>
                    <span className="font-bold text-primary">{fmtMoney(s.price)}</span>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Step 2: 人員 */}
      {step === 1 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {staffList.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setStaff(s);
                setStep(2);
              }}
              className="flex items-center gap-3 rounded-xl border bg-card p-4 text-left hover:border-primary hover:shadow-md transition-all"
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full text-white font-bold"
                style={{ background: s.color }}
              >
                {s.name.slice(0, 1)}
              </span>
              <span>
                <span className="font-bold">{s.name}</span>
                <br />
                <span className="text-xs text-muted-foreground">{s.title}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Step 3: 日期時段 */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium mb-2">選擇日期</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {days.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDate(d.value)}
                  className={cn(
                    "flex w-14 shrink-0 flex-col items-center rounded-lg border py-2 text-sm",
                    date === d.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <span className="text-xs opacity-80">{d.isToday ? "今天" : `週${d.weekday}`}</span>
                  <span className="font-bold">{d.label}</span>
                </button>
              ))}
            </div>
          </div>
          {date && (
            <div>
              <p className="text-sm font-medium mb-2">
                選擇時段
                <span className="text-muted-foreground font-normal ml-2 text-xs">
                  {staff?.name}・{service?.name}（{service?.durationMin} 分鐘）
                </span>
              </p>
              {slots === null ? (
                <p className="text-sm text-muted-foreground py-3">查詢可預約時段中…</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-muted-foreground py-3">
                  這天已約滿或人員休假，請換一天或換服務人員
                </p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {slots.map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setTime(t);
                        setStep(3);
                      }}
                      className={cn(
                        "rounded-md border py-2 text-sm font-mono",
                        time === t
                          ? "border-primary bg-primary text-primary-foreground"
                          : "hover:border-primary hover:text-primary"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 4: 資料 */}
      {step === 3 && (
        <form onSubmit={submit} className="space-y-4 max-w-md mx-auto">
          <div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-1.5">
            <Row label="服務" value={`${service?.name}（${fmtMoney(service?.price ?? 0)}）`} />
            <Row label="服務人員" value={staff?.name ?? ""} />
            <Row label="日期時間" value={`${date} ${time}`} />
          </div>
          <div className="space-y-1.5">
            <Label>姓名 *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>手機號碼 *</Label>
            <Input
              type="tel"
              placeholder="09xx-xxx-xxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>備註（選填）</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="想要的款式、注意事項…" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
            {loading ? "送出中…" : "確認預約"}
          </Button>
        </form>
      )}
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
