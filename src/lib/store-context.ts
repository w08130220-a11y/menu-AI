import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

type SessionStaff = { id: string; role: string; storeId: string };

// 取得目前檢視的分店：
// - ADMIN 可用切換器選擇單一分店或「全部分店」(null)
// - 店長 / 員工固定為所屬分店
export async function getActiveStoreId(staff: SessionStaff): Promise<string | null> {
  if (staff.role !== "ADMIN") return staff.storeId;
  const store = await cookies();
  const selected = store.get("bs_store")?.value;
  if (!selected || selected === "all") return null;
  const exists = await prisma.store.findUnique({ where: { id: selected } });
  return exists ? selected : null;
}

export async function getStores() {
  return prisma.store.findMany({ orderBy: { name: "asc" } });
}

// Prisma where 條件：依分店過濾「員工相關」資料
export function byStore(storeId: string | null) {
  return storeId ? { storeId } : {};
}
