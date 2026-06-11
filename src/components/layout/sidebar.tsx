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
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLES } from "@/lib/constants";

type NavItem = {
  key: string;
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  managerOnly?: boolean;
  adminOnly?: boolean;
};

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "日常營運",
    items: [
      { key: "dashboard", href: "/dashboard", label: "儀表板", icon: LayoutDashboard },
      { key: "appointments", href: "/appointments", label: "預約管理", icon: CalendarDays },
      { key: "pos", href: "/pos", label: "POS 收款", icon: ShoppingCart },
      { key: "clock", href: "/clock", label: "上下班打卡", icon: Clock },
      { key: "notifications", href: "/notifications", label: "LINE 通知", icon: BellRing, managerOnly: true },
    ],
  },
  {
    title: "顧客",
    items: [{ key: "customers", href: "/customers", label: "顧客管理", icon: Users }],
  },
  {
    title: "團隊",
    items: [
      { key: "schedule", href: "/schedule", label: "員工排班", icon: CalendarRange },
      { key: "performance", href: "/performance", label: "業績紀錄", icon: TrendingUp },
      { key: "payroll", href: "/payroll", label: "薪資計算", icon: Wallet },
      { key: "staff", href: "/staff", label: "員工管理", icon: UserCog, managerOnly: true },
    ],
  },
  {
    title: "店務設定",
    items: [
      { key: "reports", href: "/reports", label: "跨店報表", icon: BarChart3, managerOnly: true },
      { key: "services", href: "/services", label: "服務項目", icon: Scissors, managerOnly: true },
      { key: "inventory", href: "/inventory", label: "產品庫存", icon: Package, managerOnly: true },
      { key: "billing", href: "/billing", label: "訂閱方案", icon: CreditCard, adminOnly: true },
    ],
  },
];

export function Sidebar({
  staff,
  stores,
  activeStoreId,
  allowed,
}: {
  staff: { name: string; role: string; title: string | null; storeName: string };
  stores: { id: string; name: string }[];
  activeStoreId: string | null;
  allowed: string[];
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
    <aside className="flex h-screen w-60 shrink-0 flex-col bg-ink text-white/80 sticky top-0">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
        <Sparkles className="h-5 w-5 text-gold" />
        <div>
          <p className="font-brand font-bold leading-tight text-white">
            Beauty<span className="text-gold">Time</span>
          </p>
          <p className="text-[11px] text-white/45 leading-tight mt-0.5">{staff.storeName}</p>
        </div>
      </div>

      {/* 管理者：分店切換器 */}
      {staff.role === "ADMIN" && stores.length > 1 && (
        <div className="border-b border-white/10 px-3 py-2.5">
          <div className="flex items-center gap-1.5 px-1 mb-1 text-xs text-white/40">
            <Store className="h-3.5 w-3.5" /> 檢視分店
          </div>
          <select
            className="w-full rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-white [&>option]:text-foreground"
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
          const items = group.items.filter((i) => {
            if (i.adminOnly) return staff.role === "ADMIN";
            if (i.managerOnly) return manager;
            if (i.key === "clock") return true;
            return manager || allowed.includes(i.key);
          });
          if (items.length === 0) return null;
          return (
            <div key={group.title}>
              <p className="px-2 mb-1.5 text-[11px] font-medium tracking-wider text-white/35">
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
                        ? "bg-white/10 text-gold"
                        : "text-white/65 hover:bg-white/5 hover:text-white"
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
          <p className="px-2 mb-1.5 text-[11px] font-medium tracking-wider text-white/35">顧客端</p>
          <a
            href="/booking"
            target="_blank"
            className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-white/65 hover:bg-white/5 hover:text-white"
          >
            <Globe className="h-4 w-4" />
            線上預約頁面
          </a>
        </div>
      </nav>
      <div className="border-t border-white/10 px-4 py-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate text-white">{staff.name}</p>
          <p className="text-xs text-white/45 truncate">
            {staff.title ?? ROLES[staff.role]}
          </p>
        </div>
        <button
          onClick={logout}
          title="登出"
          className="rounded-md p-2 text-white/50 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
