import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { clientIp } from "@/lib/rate-limit";

const ymd = (d: Date) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};

// 兩點距離（公尺，Haversine）
function distanceM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// 打卡：尚無未下班紀錄 → 上班卡；有 → 補下班卡
// 依分店設定檢查打卡位置（IP 或 GPS）
export async function POST(request: Request) {
  const staff = await getSession();
  if (!staff) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const store = staff.store;
  if (store.clockMode === "IP") {
    const ip = clientIp(request);
    const allowed = (store.allowedIps ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!allowed.includes(ip)) {
      return NextResponse.json(
        { error: `目前網路（${ip}）不在店內允許清單，請連接店內 Wi-Fi 後再打卡` },
        { status: 403 }
      );
    }
  } else if (store.clockMode === "GPS") {
    const { lat, lng } = await request.json().catch(() => ({}));
    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json(
        { error: "需要定位權限才能打卡，請允許瀏覽器取得位置" },
        { status: 400 }
      );
    }
    if (store.latitude == null || store.longitude == null) {
      return NextResponse.json({ error: "店家尚未設定座標，請聯絡管理者" }, { status: 400 });
    }
    const dist = Math.round(distanceM(lat, lng, store.latitude, store.longitude));
    if (dist > store.radiusM) {
      return NextResponse.json(
        { error: `你距離店面約 ${dist} 公尺（允許 ${store.radiusM} 公尺內），請到店後再打卡` },
        { status: 403 }
      );
    }
  }

  const now = new Date();
  const open = await prisma.timeRecord.findFirst({
    where: { staffId: staff.id, clockOut: null },
    orderBy: { clockIn: "desc" },
  });

  if (open) {
    await prisma.timeRecord.update({
      where: { id: open.id },
      data: { clockOut: now },
    });
    return NextResponse.json({ ok: true, action: "OUT" });
  }

  await prisma.timeRecord.create({
    data: { staffId: staff.id, workDate: ymd(now), clockIn: now },
  });
  return NextResponse.json({ ok: true, action: "IN" });
}
