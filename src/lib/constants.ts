export const SERVICE_CATEGORIES: Record<string, string> = {
  HAIR: "美髮",
  NAIL: "美甲",
  LASH: "美睫",
  SPA: "按摩 SPA",
  FACIAL: "臉部護理",
};

export const APPOINTMENT_STATUS: Record<string, string> = {
  PENDING: "待確認",
  CONFIRMED: "已確認",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
  NO_SHOW: "未到",
};

export const APPOINTMENT_SOURCE: Record<string, string> = {
  ONLINE: "線上預約",
  PHONE: "電話預約",
  WALK_IN: "現場",
};

export const PAYMENT_METHODS: Record<string, string> = {
  CASH: "現金",
  CARD: "刷卡",
  TRANSFER: "轉帳",
  BALANCE: "儲值金",
};

export const SHIFT_TYPES: Record<string, { label: string; start: string; end: string }> = {
  MORNING: { label: "早班", start: "10:00", end: "16:00" },
  EVENING: { label: "晚班", start: "14:00", end: "20:00" },
  FULL: { label: "全班", start: "10:00", end: "20:00" },
  CUSTOM: { label: "自訂", start: "", end: "" },
  OFF: { label: "休假", start: "", end: "" },
};

export const LEAVE_TYPES: Record<string, string> = {
  PERSONAL: "事假",
  SICK: "病假",
};

export const CLOCK_MODES: Record<string, string> = {
  ANY: "不限制",
  IP: "限店內網路（IP）",
  GPS: "限店面位置（GPS）",
};

export const ROLES: Record<string, string> = {
  ADMIN: "管理者",
  MANAGER: "店長",
  STAFF: "員工",
};

export function fmtMoney(n: number) {
  return `NT$ ${n.toLocaleString("zh-TW")}`;
}
