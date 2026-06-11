import Link from "next/link";
import { redirect } from "next/navigation";
import { Lock, Hourglass } from "lucide-react";
import { getSession } from "@/lib/session";
import { getActiveStoreId, getStores } from "@/lib/store-context";
import { allowedPages } from "@/lib/permissions";
import { getSubscription, isLocked } from "@/lib/billing";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const staff = await getSession();
  if (!staff) redirect("/login");

  const [stores, activeStoreId, subscription] = await Promise.all([
    getStores(),
    getActiveStoreId(staff),
    getSubscription(),
  ]);
  const activeStore = stores.find((s) => s.id === activeStoreId);

  // 訂閱到期 → 鎖定後台
  if (isLocked(subscription)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-orange-50 to-background px-4 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <Lock className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">
          {subscription.effective === "INACTIVE" ? "尚未訂閱" : "訂閱已到期"}
        </h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          {staff.role === "ADMIN"
            ? "完成訂閱後立即恢復使用，所有資料皆完整保留。"
            : "請通知管理者完成續訂後即可繼續使用。"}
        </p>
        {staff.role === "ADMIN" && (
          <Button asChild size="lg">
            <Link href="/billing">前往訂閱方案</Link>
          </Button>
        )}
      </div>
    );
  }

  const showBanner =
    subscription.effective === "TRIALING" ||
    subscription.effective === "PAST_DUE" ||
    (subscription.effective === "ACTIVE" && (subscription.daysLeft ?? 99) <= 7);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        staff={{
          name: staff.name,
          role: staff.role,
          title: staff.title,
          storeName:
            staff.role === "ADMIN"
              ? (activeStore?.name ?? "全部分店")
              : staff.store.name,
        }}
        stores={stores.map((s) => ({ id: s.id, name: s.name }))}
        activeStoreId={activeStoreId}
        allowed={allowedPages(staff)}
      />
      <div className="flex-1 overflow-x-hidden flex flex-col">
        {showBanner && (
          <div
            className={`flex items-center gap-2 px-6 py-2 text-sm ${
              subscription.effective === "PAST_DUE"
                ? "bg-amber-100 text-amber-800"
                : "bg-sky-100 text-sky-800"
            }`}
          >
            <Hourglass className="h-4 w-4 shrink-0" />
            {subscription.effective === "TRIALING" && (
              <span>免費試用中，剩 {subscription.daysLeft} 天。</span>
            )}
            {subscription.effective === "PAST_DUE" && (
              <span>訂閱扣款失敗，請儘速更新付款方式以免服務中斷。</span>
            )}
            {subscription.effective === "ACTIVE" && (
              <span>訂閱將於 {subscription.daysLeft} 天後到期。</span>
            )}
            {staff.role === "ADMIN" && (
              <Link href="/billing" className="ml-auto font-medium underline shrink-0">
                管理訂閱 →
              </Link>
            )}
          </div>
        )}
        <main className="flex-1 px-6 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
