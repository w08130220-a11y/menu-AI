import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isManager } from "@/lib/session";
import { getActiveStoreId } from "@/lib/store-context";

// 更新分店設定（打卡限制 / 薪資規則）。
// 管理者更新切換中的分店；店長更新自己的分店。
export async function PATCH(request: Request) {
  const me = await getSession();
  if (!me || !isManager(me)) {
    return NextResponse.json({ error: "需要管理者權限" }, { status: 403 });
  }
  const activeStoreId = await getActiveStoreId(me);
  const storeId = activeStoreId ?? me.storeId;

  const body = await request.json();
  const num = (v: unknown) => (v === "" || v == null ? null : Number(v));

  const updated = await prisma.store.update({
    where: { id: storeId },
    data: {
      ...(body.clockMode !== undefined && {
        clockMode: ["ANY", "IP", "GPS"].includes(body.clockMode) ? body.clockMode : "ANY",
      }),
      ...(body.allowedIps !== undefined && { allowedIps: body.allowedIps || null }),
      ...(body.latitude !== undefined && { latitude: num(body.latitude) }),
      ...(body.longitude !== undefined && { longitude: num(body.longitude) }),
      ...(body.radiusM !== undefined && { radiusM: Math.max(20, Number(body.radiusM) || 150) }),
      ...(body.lateGraceMin !== undefined && { lateGraceMin: Math.max(0, Number(body.lateGraceMin) || 0) }),
      ...(body.latePerMin !== undefined && { latePerMin: Math.max(0, Number(body.latePerMin) || 0) }),
      ...(body.fullAttendanceBonus !== undefined && { fullAttendanceBonus: Math.max(0, Number(body.fullAttendanceBonus) || 0) }),
      ...(body.lineChannelAccessToken !== undefined && {
        lineChannelAccessToken: String(body.lineChannelAccessToken).trim() || null,
      }),
      ...(body.lineChannelSecret !== undefined && {
        lineChannelSecret: String(body.lineChannelSecret).trim() || null,
      }),
    },
  });
  return NextResponse.json({ id: updated.id });
}
