import Link from "next/link";
import {
  CalendarCheck,
  LogIn,
  Scissors,
  ShoppingCart,
  Clock,
  Users,
  MessageCircle,
  BarChart3,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TIERS, yearlyPrice } from "@/lib/billing";

const FEATURES = [
  {
    icon: CalendarCheck,
    title: "線上預約",
    desc: "顧客免註冊，四步驟完成預約；自動依排班計算可約時段，杜絕撞單。",
  },
  {
    icon: MessageCircle,
    title: "LINE 自動通知",
    desc: "綁定商家官方帳號，預約確認、前日提醒自動推播，降低 No-show。",
  },
  {
    icon: ShoppingCart,
    title: "POS 收款",
    desc: "服務與產品一鍵結帳，業績歸屬、儲值金折抵、庫存同步扣減。",
  },
  {
    icon: Clock,
    title: "排班與打卡",
    desc: "自訂班別、GPS／IP 打卡限制，薪資依出勤與抽成自動試算。",
  },
  {
    icon: Users,
    title: "顧客經營",
    desc: "消費履歷、施作照片、療程券與儲值金，舊客回流看得見。",
  },
  {
    icon: BarChart3,
    title: "跨店報表",
    desc: "多分店切換、營收趨勢、員工業績排行，數字說話的經營決策。",
  },
];

const CATEGORIES = ["美髮沙龍", "美甲美睫", "按摩 SPA", "臉部護理", "個人工作室", "連鎖品牌"];

export default function LandingPage() {
  const tiers = (Object.keys(TIERS) as (keyof typeof TIERS)[]).map((k) => ({
    key: k,
    ...TIERS[k],
    yearly: yearlyPrice(k),
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* 導覽列 */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <span className="font-brand text-xl font-bold text-white">
            Beauty<span className="text-gold">Time</span>
          </span>
          <nav className="hidden items-center gap-7 text-sm text-white/70 md:flex">
            <a href="#features" className="hover:text-white">功能</a>
            <a href="#pricing" className="hover:text-white">方案</a>
            <Link href="/booking" className="hover:text-white">線上預約</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
              <Link href="/login">
                <LogIn className="mr-1 h-4 w-4" /> 登入
              </Link>
            </Button>
            <Button asChild size="sm" className="bg-gold text-ink hover:bg-gold/90 font-bold" style={{ color: "hsl(172 45% 8%)" }}>
              <Link href="/login">免費試用 7 天</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-ink ink-texture text-white">
        <div className="mx-auto max-w-6xl px-5 pb-20 pt-16 md:pb-28 md:pt-24">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 px-3.5 py-1 text-xs tracking-wide text-white/70">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            美髮・美甲美睫・SPA・臉部護理 一站式管理
          </p>
          <h1 className="font-brand max-w-3xl text-4xl font-black leading-tight md:text-6xl">
            把時間留給手藝，
            <br />
            經營交給 <span className="text-gold">BeautyTime</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/65 md:text-lg">
            預約、收款、排班、薪資、顧客經營——
            一套系統收齊美容業日常的每一件瑣事，店主只需專注在客人身上。
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 bg-gold px-8 text-base font-bold hover:bg-gold/90" style={{ color: "hsl(172 45% 8%)" }}>
              <Link href="/login">免費試用 7 天，不綁卡</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 border-white/25 bg-transparent px-8 text-base text-white hover:bg-white/10 hover:text-white">
              <Link href="/booking">
                <CalendarCheck className="mr-2 h-5 w-5" /> 體驗顧客預約流程
              </Link>
            </Button>
          </div>

          <div className="mt-14 grid max-w-2xl grid-cols-3 gap-6 border-t border-white/10 pt-8">
            {[
              ["3 分鐘", "完成一筆線上預約"],
              ["200 則/月", "LINE 免費推播額度"],
              ["1 套系統", "取代 5 種工具"],
            ].map(([num, label]) => (
              <div key={label}>
                <p className="font-brand text-2xl font-bold text-gold md:text-3xl">{num}</p>
                <p className="mt-1 text-xs text-white/55 md:text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 適用業種 */}
      <div className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-5 py-5 text-sm text-muted-foreground">
          {CATEGORIES.map((c) => (
            <span key={c} className="flex items-center gap-1.5">
              <Scissors className="h-3.5 w-3.5 text-accent" />
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* 功能 */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-20">
        <p className="text-center text-sm font-medium tracking-widest text-accent">FEATURES</p>
        <h2 className="font-brand mt-2 text-center text-3xl font-bold md:text-4xl">
          開店需要的，這裡都有
        </h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-xl border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 方案 */}
      <section id="pricing" className="border-t bg-secondary/40">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="text-center text-sm font-medium tracking-widest text-accent">PRICING</p>
          <h2 className="font-brand mt-2 text-center text-3xl font-bold md:text-4xl">
            透明定價，隨店成長
          </h2>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            首次訂閱免費試用 7 天・年繳一次付清享 8 折
          </p>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {tiers.map((t) => {
              const popular = t.key === "PLUS";
              return (
                <div
                  key={t.key}
                  className={`relative rounded-xl border bg-card p-6 ${popular ? "border-primary shadow-lg shadow-primary/10" : ""}`}
                >
                  {popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-white">
                      最受歡迎
                    </span>
                  )}
                  <h3 className="font-bold">{t.label}方案</h3>
                  <p className="mt-3">
                    <span className="font-brand text-4xl font-bold">${t.monthly}</span>
                    <span className="text-sm text-muted-foreground"> /月</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    年繳 ${t.yearly.toLocaleString()}（月均 ${Math.round(t.yearly / 12)}）
                  </p>
                  <ul className="mt-5 space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-accent" /> 主帳號＋{t.staffLimit} 位員工
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-accent" />
                      {t.storeLimit === 1 ? "單一門市" : `最多 ${t.storeLimit} 間門市`}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-accent" /> 全功能不分級
                    </li>
                  </ul>
                  <Button asChild className="mt-6 w-full" variant={popular ? "default" : "outline"}>
                    <Link href="/login">開始免費試用</Link>
                  </Button>
                </div>
              );
            })}
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            大型連鎖另有企業方案，<Link href="/login" className="underline hover:text-foreground">聯絡我們</Link>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink ink-texture text-white">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center">
          <h2 className="font-brand text-3xl font-bold md:text-4xl">
            今天就讓店務<span className="text-gold">自己動起來</span>
          </h2>
          <p className="mt-3 text-white/60">7 天免費試用，資料隨時匯入匯出，不滿意不收費。</p>
          <Button asChild size="lg" className="mt-8 h-12 bg-gold px-10 text-base font-bold hover:bg-gold/90" style={{ color: "hsl(172 45% 8%)" }}>
            <Link href="/login">免費開始</Link>
          </Button>
        </div>
        <footer className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-white/40">
            <span className="font-brand text-sm text-white/70">
              Beauty<span className="text-gold">Time</span>
            </span>
            <span>© {new Date().getFullYear()} BeautyTime・美容業一站式管理系統</span>
          </div>
        </footer>
      </section>
    </div>
  );
}
