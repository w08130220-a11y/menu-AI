import Link from "next/link";
import { Sparkles, CalendarCheck, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-orange-50 to-background px-4">
      <div className="flex items-center gap-2 mb-4 text-primary">
        <Sparkles className="h-8 w-8" />
        <span className="text-3xl font-bold tracking-wide">BeauHub</span>
      </div>
      <h1 className="text-2xl md:text-4xl font-bold text-center mb-3">
        美容業一站式雲端管理系統
      </h1>
      <p className="text-muted-foreground text-center max-w-xl mb-10">
        美髮・美甲美睫・按摩 SPA・臉部護理
        <br />
        線上預約、POS 收款、排班打卡、薪資業績、顧客管理，一個系統全部搞定。
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild size="lg" className="text-lg px-8 py-6">
          <Link href="/booking">
            <CalendarCheck className="mr-2 h-5 w-5" />
            我要線上預約
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6">
          <Link href="/login">
            <LogIn className="mr-2 h-5 w-5" />
            員工 / 管理者登入
          </Link>
        </Button>
      </div>
      <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-sm text-muted-foreground">
        {["線上預約管理", "POS 收款結帳", "排班與打卡", "薪資業績報表"].map((f) => (
          <div key={f} className="rounded-lg border bg-card px-6 py-4 font-medium">
            {f}
          </div>
        ))}
      </div>
    </div>
  );
}
