"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  ShoppingCart,
  Users,
  Clock,
  CalendarRange,
  Wallet,
  TrendingUp,
  Scissors,
  Package,
  UserCog,
  Sparkles,
  LogOut,
  Globe,
  BellRing,
  BarChart3,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLES } from "@/lib/constants";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  managerOnly?: boolean;
};

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "日常營運",
    items: [
      { href: "/dashboard", label: "儀表板", icon: LayoutDashboard },
      { href: "/appointments", label: "預約管理", icon: CalendarDays },
      { href: "/pos", label: "POS 收款", icon: ShoppingCart },
      { href: "/clock", label: "上下班打卡", icon: Clock },
      { href: "/notifications", label: "通知紀錄", icon: BellRing, managerOnly: true },
    ],
  },
  {
    title: "顧客",
    items: [{ href: "/customers", label: "顧客管理", icon: Users }],
  },
  {
    title: "團隊",
    items: [
      { href: "/schedule", label: "員工排班", icon: CalendarRange },
      { href: "/performance", label: "業績紀錄", icon: TrendingUp },
      { href: "/payroll", label: "薪資計算", icon: Wallet },
      { href: "/staff", label: "員工管理", icon: UserCog, managerOnly: true },
    ],
  },
  {
    title: "店務設定",
    items: [
      { href: "/reports", label: "跨店報表", icon: BarChart3, managerOnly: true },
      { href: "/services", label: "服務項目", icon: Scissors, managerOnly: true },
      { href: "/inventory", label: "產品庫存", icon: Package, managerOnly: true },
    ],
  },
];

export function Sidebar({
  staff,
  stores,
  activeStoreId,
}: {
  staff: { name: string; role: string; title: string | null; storeName: string };
  stores: { id: string; name: string }[];
  activeStoreId: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const manager = staff.role === "ADMIN" || staff.role === "MANAGER";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function switchStore(storeId: string) {
    await fetch("/api/store-switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId }),
    });
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r bg-card sticky top-0">
      <div className="flex items-center gap-2 px-5 py-4 border-b">
        <Sparkles className="h-6 w-6 text-primary" />
        <div>
          <p className="font-bold leading-tight">BeauHub</p>
          <p className="text-xs text-muted-foreground leading-tight">{staff.storeName}</p>
        </div>
      </div>

      {/* 管理者：分店切換器 */}
      {staff.role === "ADMIN" && stores.length > 1 && (
        <div className="border-b px-3 py-2.5">
          <div className="flex items-center gap-1.5 px-1 mb-1 text-xs text-muted-foreground">
            <Store className="h-3.5 w-3.5" /> 檢視分店
          </div>
          <select
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            value={activeStoreId ?? "all"}
            onChange={(e) => switchStore(e.target.value)}
          >
            <option value="all">全部分店</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((i) => !i.managerOnly || manager);
          if (items.length === 0) return null;
          return (
            <div key={group.title}>
              <p className="px-2 mb-1.5 text-xs font-medium text-muted-foreground">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                      pathname.startsWith(item.href)
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/70 hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
        <div>
          <p className="px-2 mb-1.5 text-xs font-medium text-muted-foreground">顧客端</p>
          <a
            href="/booking"
            target="_blank"
            className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-foreground/70 hover:bg-muted hover:text-foreground"
          >
            <Globe className="h-4 w-4" />
            線上預約頁面
          </a>
        </div>
      </nav>
      <div className="border-t px-4 py-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{staff.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {staff.title ?? ROLES[staff.role]}
          </p>
        </div>
        <button
          onClick={logout}
          title="登出"
          className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
