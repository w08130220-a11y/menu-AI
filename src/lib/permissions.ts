// 員工可見頁籤權限。
// - ADMIN / MANAGER：一律全部可見（含管理頁）
// - STAFF：permissions 為 null 時預設全部開放；否則僅開放勾選的頁籤
// - 「上下班打卡」一律開放，無法關閉
export const STAFF_PAGES: { key: string; label: string }[] = [
  { key: "dashboard", label: "儀表板" },
  { key: "appointments", label: "預約管理" },
  { key: "pos", label: "POS 收款" },
  { key: "customers", label: "顧客管理" },
  { key: "schedule", label: "員工排班" },
  { key: "performance", label: "業績紀錄" },
  { key: "payroll", label: "薪資計算（僅個人）" },
];

const ALL_KEYS = STAFF_PAGES.map((p) => p.key);

type StaffLike = { role: string; permissions: string | null };

export function allowedPages(staff: StaffLike): string[] {
  if (staff.role === "ADMIN" || staff.role === "MANAGER") return ALL_KEYS;
  if (staff.permissions == null) return ALL_KEYS;
  return staff.permissions.split(",").filter((k) => ALL_KEYS.includes(k));
}

export function canAccess(staff: StaffLike, pageKey: string): boolean {
  if (pageKey === "clock") return true;
  return allowedPages(staff).includes(pageKey);
}
